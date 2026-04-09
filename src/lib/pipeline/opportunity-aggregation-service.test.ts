import test from "node:test";
import assert from "node:assert/strict";

import { OpportunityAggregationService } from "@/lib/pipeline/opportunity-aggregation-service";
import type {
  GapRecord,
  NormalizedFeatureGroup,
  RecommendationRecord,
} from "@/lib/pipeline/types";

const groups: NormalizedFeatureGroup[] = [
  {
    module: "Claims",
    title: "Claims automation opportunity",
    description: "Automate repeatable claims intake and review work.",
    featureIds: ["f1", "f2"],
    features: [
      {
        id: "f1",
        workspaceId: "w1",
        title: "Claims intake",
        module: "Claims",
        description: "Manual claims intake from email and PDF",
        confidenceScore: 80,
        tags: ["manual", "claims"],
        sourceCount: 2,
        excerpts: ["Manual intake from inbox"],
      },
      {
        id: "f2",
        workspaceId: "w1",
        title: "Claims review",
        module: "Claims",
        description: "Review queue with frequent handoffs",
        confidenceScore: 76,
        tags: ["review", "handoff"],
        sourceCount: 1,
        excerpts: ["Team reviews every submission manually"],
      },
    ],
    averageConfidence: 78,
    sourceCoverageScore: 72,
    currentAutomationLevel: 0.3,
    weeklyHoursSaved: 14,
    errorReductionScore: 74,
    volumeScore: 76,
    strategicValueScore: 68,
    regulatoryRisk: 73,
    exceptionComplexity: 55,
    accuracySensitivity: 64,
    changeManagementRisk: 40,
    dataStructureScore: 70,
  },
];

const gaps: GapRecord[] = [
  {
    module: "Claims",
    title: "Claims execution gap",
    description: "Claims processing is still partial and review-heavy.",
    currentAutomationLevel: 0.3,
  },
];

const recommendations: RecommendationRecord[] = [
  {
    module: "Claims",
    recommendation:
      "Deploy a decision-support agent for claims review and exception routing.",
    summary: "Claims is repeatable and evidence-backed enough for phased automation.",
    agentType: "Decision-support agent",
    phase: "Phase 1",
    quickWin: true,
    kpis: ["Cycle time", "Hours saved"],
    risks: ["Compliance sign-off required"],
    implementationNotes: "Keep human review on exception handling first.",
    breakEvenMonths: 3,
  },
];

test("OpportunityAggregationService builds a stable opportunity response", () => {
  const service = new OpportunityAggregationService();
  const [opportunity] = service.aggregate({
    groups,
    gaps,
    recommendations,
  });

  assert.equal(opportunity.module, "Claims");
  assert.equal(opportunity.maturity, "PARTIAL");
  assert.equal(opportunity.agentType, "Decision-support agent");
  assert.equal(opportunity.impact.yearlyHoursSaved, 700);
  assert.equal(opportunity.impact.annualDollarValue, 45500);
  assert.equal(opportunity.priorityScore, 55);
  assert.deepEqual(opportunity.tags, [
    "Time savings",
    "Compliance",
    "Error reduction",
    "Scalability",
  ]);
});
