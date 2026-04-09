import type { Prisma } from "@/generated/prisma/client";
import { isMissingAnalyticsSchemaError } from "@/lib/features/workspace-analytics";
import { prisma } from "@/lib/prisma";
import { DashboardAggregationService } from "@/lib/pipeline/dashboard-aggregation-service";
import { FeatureExtractionService } from "@/lib/pipeline/feature-extraction-service";
import { FeatureNormalizationService } from "@/lib/pipeline/feature-normalization-service";
import { GapDetectionService } from "@/lib/pipeline/gap-detection-service";
import { IngestService } from "@/lib/pipeline/ingest-service";
import { ParsingService } from "@/lib/pipeline/parsing-service";
import { OpportunityAggregationService } from "@/lib/pipeline/opportunity-aggregation-service";
import { RecommendationService } from "@/lib/pipeline/recommendation-service";
import type { PipelineFeature, PipelineFeatureSeed, PipelineOutput } from "@/lib/pipeline/types";

type PersistedFeatureContext = {
  workspaceId: string;
  documentId: string;
  sourceId?: string | null;
};

export class PipelineOrchestrator {
  constructor(
    private readonly ingestService = new IngestService(),
    private readonly parsingService = new ParsingService(),
    private readonly featureExtractionService = new FeatureExtractionService(),
    private readonly featureNormalizationService = new FeatureNormalizationService(),
    private readonly gapDetectionService = new GapDetectionService(),
    private readonly recommendationService = new RecommendationService(),
    private readonly opportunityAggregationService = new OpportunityAggregationService(),
    private readonly dashboardAggregationService = new DashboardAggregationService()
  ) {}

  buildFeatureSeeds(input: { documentTitle: string; extractedText: string | null }) {
    const ingested = this.ingestService.ingest(input);
    const parsed = this.parsingService.parse({
      extractedText: ingested.extractedText,
    });

    return this.featureExtractionService.extract({
      documentTitle: ingested.documentTitle,
      extractedText: parsed.text,
    });
  }

  async persistFeatures(
    featureSeeds: PipelineFeatureSeed[],
    context: PersistedFeatureContext
  ) {
    const createdFeatures: PipelineFeature[] = [];

    for (const featureSeed of featureSeeds) {
      const feature = await prisma.feature.create({
        data: {
          workspaceId: context.workspaceId,
          title: featureSeed.title,
          module: featureSeed.module,
          description: featureSeed.description,
          confidenceScore: featureSeed.confidenceScore,
          tags: featureSeed.tags,
          owner: null,
          sources: {
            create: {
              documentId: context.documentId,
              sourceId: context.sourceId ?? null,
              excerpt: featureSeed.excerpt,
            },
          },
        },
        select: {
          id: true,
          workspaceId: true,
          capabilityId: true,
          title: true,
          module: true,
          description: true,
          confidenceScore: true,
          tags: true,
          sources: {
            select: {
              excerpt: true,
            },
          },
        },
      });

      createdFeatures.push({
        id: feature.id,
        workspaceId: feature.workspaceId,
        capabilityId: feature.capabilityId,
        title: feature.title,
        module: feature.module ?? "General",
        description: feature.description,
        confidenceScore: feature.confidenceScore,
        tags: feature.tags,
        sourceCount: feature.sources.length,
        excerpts: feature.sources
          .map((source) => source.excerpt)
          .filter((excerpt): excerpt is string => Boolean(excerpt)),
      });
    }

    return createdFeatures;
  }

  buildOutput(features: PipelineFeature[]): PipelineOutput {
    const groups = this.featureNormalizationService.normalize(features);
    const gaps = this.gapDetectionService.detect(groups);
    const recommendations = this.recommendationService.recommend({ groups, gaps });
    const opportunities = this.opportunityAggregationService.aggregate({
      groups,
      gaps,
      recommendations,
    });
    const moduleSummaries =
      this.dashboardAggregationService.buildModuleSummaries(opportunities);
    const dashboardSnapshot = this.dashboardAggregationService.aggregate(
      opportunities,
      moduleSummaries
    );

    return {
      features,
      opportunities,
      moduleSummaries,
      dashboardSnapshot,
    };
  }

  async persistAnalytics(input: {
    extractionJobId: string;
    workspaceId: string;
    output: PipelineOutput;
  }) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const opportunity of input.output.opportunities) {
          const capability = await tx.capability.create({
            data: {
              workspaceId: input.workspaceId,
              extractionJobId: input.extractionJobId,
              name: opportunity.title,
              module: opportunity.module,
              description: opportunity.description,
              extractedFeatureCount: opportunity.evidenceFeatureIds.length,
              hiddenFeatureEstimate: Math.max(
                1,
                Math.round(opportunity.evidenceFeatureIds.length * 0.5)
              ),
              currentMaturityTier: opportunity.maturity,
              confidenceAvg: Math.round(
                input.output.features
                  .filter((feature) => opportunity.evidenceFeatureIds.includes(feature.id))
                  .reduce((sum, feature) => sum + feature.confidenceScore, 0) /
                  Math.max(1, opportunity.evidenceFeatureIds.length)
              ),
              summaryNarrative: opportunity.summary,
            },
            select: {
              id: true,
            },
          });

          await tx.capabilityAssessment.create({
            data: {
              capabilityId: capability.id,
              maturityTier: opportunity.maturity,
              rationale: opportunity.gapDescription,
              complexityScore: Math.min(100, Math.round(opportunity.scores.risk * 0.8)),
              agentTypeLabel: opportunity.agentType,
              weeklyHoursWasted: opportunity.impact.weeklyHoursSaved,
              yearlyHoursWasted: opportunity.impact.yearlyHoursSaved,
              annualDollarImpact: opportunity.impact.annualDollarValue,
              repeatabilityScore: opportunity.scores.repeatability,
              roiScore: opportunity.scores.roiPotential,
              dataAvailabilityScore: opportunity.scores.dataAvailability,
              riskScore: opportunity.scores.risk,
              compositeOpportunityScore: opportunity.priorityScore,
              impactTags: opportunity.tags,
              scoreExplanations: opportunity.scoreExplanation as Prisma.JsonObject,
              implementationGuidance:
                opportunity.implementationGuidance as Prisma.JsonObject,
            },
          });

          await tx.feature.updateMany({
            where: {
              id: {
                in: opportunity.evidenceFeatureIds,
              },
            },
            data: {
              capabilityId: capability.id,
            },
          });

          await tx.roadmapRecommendation.create({
            data: {
              workspaceId: input.workspaceId,
              extractionJobId: input.extractionJobId,
              capabilityId: capability.id,
              priority: opportunity.priorityScore,
              phase: opportunity.roadmap.phase,
              title: opportunity.title,
              summary: opportunity.recommendation,
              quickWin: opportunity.roadmap.quickWin,
              kpisJson: opportunity.roadmap.kpis,
              risksJson: opportunity.roadmap.risks,
              breakEvenMonths: opportunity.roadmap.breakEvenMonths,
              implementationNotes: opportunity.roadmap.implementationNotes,
            },
          });
        }

        await tx.dashboardSnapshot.create({
          data: {
            workspaceId: input.workspaceId,
            extractionJobId: input.extractionJobId,
            kpiJson: input.output.dashboardSnapshot.kpis,
            moduleBreakdownJson: input.output.dashboardSnapshot.moduleBreakdown.map(
              (row) => ({
                module: row.name,
                capabilityCount: row.gapCount,
                featureCount: row.featureCount,
                weeklyHoursWasted: row.hoursAtRisk,
                opportunityScore: row.opportunityScore,
                narrative: row.narrative,
              })
            ),
            donutChartJson: input.output.dashboardSnapshot.maturityMix,
            topOpportunitiesJson: input.output.dashboardSnapshot.topOpportunities.map(
              (row) => ({
                capability: row.title,
                module: row.module,
                score: row.priorityScore,
                annualDollarImpact: row.impact.annualDollarValue,
                rationale: row.recommendation,
              })
            ),
            roadmapStatsJson: input.output.dashboardSnapshot.roadmapStats,
            riskRegisterJson: input.output.dashboardSnapshot.riskRegister.map((row) => ({
              title: row.title,
              severity: row.severity,
              mitigation: row.summary,
            })),
            quickWinsJson: input.output.dashboardSnapshot.quickWins.map((row) => ({
              title: row.title,
              summary: row.recommendation,
              breakEvenMonths: Math.max(1, Math.round(row.impact.annualDollarValue / 100000)),
            })),
            uiCopyJson: input.output.dashboardSnapshot.uiCopy as Prisma.JsonObject,
          },
        });
      });

      return true;
    } catch (error) {
      if (!isMissingAnalyticsSchemaError(error)) {
        throw error;
      }

      console.warn(
        "Skipping pipeline analytics persistence because the analytics tables are missing. Apply the latest Prisma migrations to enable capability dashboards."
      );

      return false;
    }
  }
}
