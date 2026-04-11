export type Maturity = "NON_AGENTIC" | "PARTIAL" | "AGENTIC";

export type OpportunityScores = {
  repeatability: number;
  roiPotential: number;
  dataAvailability: number;
  risk: number;
};

export type OpportunityImpact = {
  weeklyHoursSaved: number;
  yearlyHoursSaved: number;
  annualDollarValue: number;
};

export type OpportunityScoreExplanation = {
  repeatability: string;
  roiPotential: string;
  dataAvailability: string;
  risk: string;
  priorityScore: string;
};

export type PipelineFeature = {
  id: string;
  workspaceId: string;
  capabilityId?: string | null;
  title: string;
  module: string;
  description: string | null;
  confidenceScore: number;
  tags: string[];
  sourceCount: number;
  excerpts: string[];
};

export type PipelineFeatureSeed = {
  title: string;
  module: string;
  description: string;
  confidenceScore: number;
  tags: string[];
  excerpt: string;
};

export type NormalizedFeatureGroup = {
  module: string;
  title: string;
  description: string;
  featureIds: string[];
  features: PipelineFeature[];
  averageConfidence: number;
  sourceCoverageScore: number;
  currentAutomationLevel: number;
  weeklyHoursSaved: number;
  errorReductionScore: number;
  volumeScore: number;
  strategicValueScore: number;
  regulatoryRisk: number;
  exceptionComplexity: number;
  accuracySensitivity: number;
  changeManagementRisk: number;
  dataStructureScore: number;
};

export type GapRecord = {
  module: string;
  title: string;
  description: string;
  currentAutomationLevel: number;
};

export type RecommendationRecord = {
  module: string;
  recommendation: string;
  summary: string;
  agentType: string;
  phase: string;
  quickWin: boolean;
  kpis: string[];
  risks: string[];
  implementationNotes: string;
  breakEvenMonths: number;
};

export type AutomationOpportunity = {
  id: string;
  title: string;
  module: string;
  description: string;
  gapTitle: string;
  gapDescription: string;
  recommendation: string;
  summary: string;
  agentType: string;
  maturity: Maturity;
  tags: string[];
  scores: OpportunityScores;
  impact: OpportunityImpact;
  priorityScore: number;
  trust: {
    confidence: number;
    confidenceLabel: string;
    sourceCount: number;
    evidenceCount: number;
    reviewGuidance: string;
    pipelineVersion: string;
  };
  evidenceFeatureIds: string[];
  currentAutomationLevel: number;
  scoreExplanation: OpportunityScoreExplanation;
  implementationGuidance: {
    scoreGuide: string;
    cardSummary: string;
    ingestNarrative: string;
    featureTabNarrative: string;
  };
  roadmap: {
    phase: string;
    quickWin: boolean;
    kpis: string[];
    risks: string[];
    breakEvenMonths: number;
    implementationNotes: string;
  };
};

export type ModuleSummary = {
  name: string;
  featureCount: number;
  gapCount: number;
  hoursAtRisk: number;
  opportunityScore: number;
  narrative: string;
};

export type DashboardSnapshot = {
  totals: {
    features: number;
    gaps: number;
    partial: number;
    automated: number;
    hoursPerWeek: number;
  };
  moduleBreakdown: ModuleSummary[];
  topOpportunities: OpportunityResponse[];
  quickWins: OpportunityResponse[];
  riskRegister: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    summary: string;
  }>;
  kpis: Array<{ label: string; value: string; helper: string }>;
  maturityMix: Array<{ label: string; value: number; helper: string }>;
  roadmapStats: Array<{ label: string; value: number; helper: string }>;
  uiCopy: {
    ingestTab: {
      featureInventory: string;
      maturity: string;
      gapAnalysis: string;
      roadmap: string;
    };
    featuresTab: {
      scoreGuide: string;
      impactGuide: string;
    };
    dashboardTab: {
      moduleBreakdown: string;
      opportunities: string;
      riskRegister: string;
    };
  };
};

export type DashboardResponse = {
  totals: {
    features: number;
    gaps: number;
    partial: number;
    automated: number;
    hoursPerWeek: number;
  };
  moduleBreakdown: Array<{
    name: string;
    featureCount: number;
    gapCount: number;
    hoursAtRisk: number;
  }>;
  topOpportunities: OpportunityResponse[];
  quickWins: OpportunityResponse[];
  riskRegister: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    summary: string;
  }>;
};

export type PipelineOutput = {
  features: PipelineFeature[];
  opportunities: AutomationOpportunity[];
  moduleSummaries: ModuleSummary[];
  dashboardSnapshot: DashboardSnapshot;
};

export type OpportunityResponse = {
  id: string;
  title: string;
  module: string;
  description: string;
  gapTitle: string;
  gapDescription: string;
  recommendation: string;
  agentType: string;
  maturity: Maturity;
  tags: string[];
  scores: OpportunityScores;
  impact: OpportunityImpact;
  priorityScore: number;
  trust: {
    confidence: number;
    confidenceLabel: string;
    sourceCount: number;
    evidenceCount: number;
    reviewGuidance: string;
    pipelineVersion: string;
  };
};
