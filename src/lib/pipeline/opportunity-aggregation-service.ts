import { ImpactService } from "@/lib/pipeline/impact-service";
import { MaturityClassificationService } from "@/lib/pipeline/maturity-classification-service";
import {
  ScoringService,
  computePriorityScore,
} from "@/lib/pipeline/scoring-service";
import {
  getConfidenceLabel,
  getPipelineVersion,
  getReviewGuidance,
} from "@/lib/trust";
import type {
  AutomationOpportunity,
  GapRecord,
  NormalizedFeatureGroup,
  RecommendationRecord,
} from "@/lib/pipeline/types";

export class OpportunityAggregationService {
  constructor(
    private readonly scoringService = new ScoringService(),
    private readonly impactService = new ImpactService(),
    private readonly maturityService = new MaturityClassificationService()
  ) {}

  aggregate(input: {
    groups: NormalizedFeatureGroup[];
    gaps: GapRecord[];
    recommendations: RecommendationRecord[];
  }) {
    return input.groups
      .map((group) => {
        const gap = input.gaps.find((item) => item.module === group.module);
        const recommendation = input.recommendations.find(
          (item) => item.module === group.module
        );

        if (!gap || !recommendation) {
          return null;
        }

        const scores = this.scoringService.computeScores({
          featureCount: group.features.length,
          averageConfidence: group.averageConfidence,
          manualSignals: Math.round((1 - group.currentAutomationLevel) * 100),
          judgmentSignals: group.exceptionComplexity,
          normalizedTimeSavings: Math.min(100, group.weeklyHoursSaved * 4),
          normalizedErrorReduction: group.errorReductionScore,
          normalizedVolume: group.volumeScore,
          normalizedStrategicValue: group.strategicValueScore,
          structuredDataScore: group.dataStructureScore,
          sourceCoverageScore: group.sourceCoverageScore,
          regulatoryRisk: group.regulatoryRisk,
          exceptionComplexity: group.exceptionComplexity,
          accuracySensitivity: group.accuracySensitivity,
          changeManagementRisk: group.changeManagementRisk,
        });
        const maturity = this.maturityService.classify(group.currentAutomationLevel);
        const impact = this.impactService.compute({
          weeklyHoursSaved: group.weeklyHoursSaved,
        });
        const tags = this.impactService.computeTags({
          weeklyHoursSaved: group.weeklyHoursSaved,
          risk: scores.risk,
          roiPotential: scores.roiPotential,
          regulatoryRisk: group.regulatoryRisk,
          errorReductionScore: group.errorReductionScore,
          volumeScore: group.volumeScore,
        });
        const priorityScore = computePriorityScore({ scores, maturity });

        const opportunity: AutomationOpportunity = {
          id: group.module,
          title: group.title,
          module: group.module,
          description: group.description,
          gapTitle: gap.title,
          gapDescription: gap.description,
          recommendation: recommendation.recommendation,
          summary: recommendation.summary,
          agentType: recommendation.agentType,
          maturity,
          tags,
          scores,
          impact,
          priorityScore,
          evidenceFeatureIds: group.featureIds,
          currentAutomationLevel: group.currentAutomationLevel,
          scoreExplanation: {
            repeatability: `${group.module} has ${group.features.length} recurring workflow signals and scores ${scores.repeatability}/100 on repeatability.`,
            roiPotential: `${group.weeklyHoursSaved} hours/week plus ${group.volumeScore}/100 scale signals produce an ROI score of ${scores.roiPotential}/100.`,
            dataAvailability: `Evidence density and source coverage yield a data availability score of ${scores.dataAvailability}/100.`,
            risk: `Regulatory, exception, accuracy, and adoption factors combine into a risk score of ${scores.risk}/100.`,
            priorityScore: `Priority ${priorityScore}/100 reflects ROI, repeatability, data readiness, inverse risk, and the maturity gap.`,
          },
          implementationGuidance: {
            scoreGuide: `Focus on opportunities above 70 priority when repeatability and ROI both clear implementation thresholds.`,
            cardSummary: recommendation.summary,
            ingestNarrative: `${group.module} extracted signals were normalized into a single automation opportunity with deterministic scoring.`,
            featureTabNarrative: `The supporting features for ${group.module} remain reviewable as evidence for this opportunity.`,
          },
          roadmap: {
            phase: recommendation.phase,
            quickWin: recommendation.quickWin,
            kpis: recommendation.kpis,
            risks: recommendation.risks,
            breakEvenMonths: recommendation.breakEvenMonths,
            implementationNotes: recommendation.implementationNotes,
          },
          trust: {
            confidence: group.averageConfidence,
            confidenceLabel: getConfidenceLabel(group.averageConfidence),
            sourceCount: group.features.reduce(
              (sum, feature) => sum + feature.sourceCount,
              0
            ),
            evidenceCount: group.featureIds.length,
            reviewGuidance: getReviewGuidance(group.averageConfidence),
            pipelineVersion: getPipelineVersion(),
          },
        };

        return opportunity;
      })
      .filter((value): value is AutomationOpportunity => Boolean(value))
      .sort((left, right) => right.priorityScore - left.priorityScore);
  }
}
