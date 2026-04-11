import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { AI_CONFIG_DEFAULTS } from "@/lib/ai-config/shared";
import {
  getAnthropicApiKeyConfigurationError,
  getAnthropicApiKeyFormatError,
  resolveAnthropicApiKey,
} from "@/lib/ai-config/provider-runtime";
import { resolveWorkspaceAiRuntime } from "@/lib/ai-config/workspace-ai-config";

const ANALYSIS_SYSTEM = `You are an enterprise workflow automation analyst. Analyze product documentation and identify workflow features and their agentic readiness.

Return ONLY valid JSON matching the exact schema provided. No markdown fences, no explanation — just the raw JSON object.`;

export interface AnalysisFeature {
  id: number;
  module: string;
  name: string;
  status: "none" | "partial" | "agentic";
  confidence_score?: number;
  current: string;
  gap: string;
  recommendation: string;
  agent_type: string;
  impact: string[];
  hours_saved_weekly: number;
  complexity: "Low" | "Medium" | "High";
  scores: {
    repeatability: number;
    roi: number;
    dataAvail: number;
    risk: number;
  };
}

export interface AnalysisResult {
  product_name: string;
  summary: string;
  industry: string;
  modules: string[];
  features: AnalysisFeature[];
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration_weeks: number;
  features: string[];
  outcome: string;
  effort: "Low" | "Medium" | "High";
  dependencies: string;
}

export interface RoadmapRisk {
  risk: string;
  mitigation: string;
  severity: "Low" | "Medium" | "High";
}

export interface RoadmapKpi {
  metric: string;
  baseline: string;
  target: string;
  timeline: string;
  owner: string;
}

export interface RoadmapResult {
  exec_summary: string;
  total_effort_weeks: number;
  roi_projection: string;
  time_savings_weekly: number;
  phases: RoadmapPhase[];
  risks: RoadmapRisk[];
  quick_wins: string[];
  kpis: RoadmapKpi[];
  investment_estimate: string;
  break_even_months: number;
}

function extractJson(text: string): string {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find first { or [ and last } or ]
  const start = text.search(/[{[]/);
  if (start === -1) return text.trim();
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (end === -1) return text.trim();
  return text.slice(start, end + 1);
}

function parseJsonSafely<T>(text: string): T {
  const raw = extractJson(text);
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try repairing truncated JSON by removing trailing comma + closing structures
    const repaired = raw.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  }
}

async function getAnthropicRuntimeConfig(
  workspaceId: string | undefined,
  purpose: "featureExtraction" | "reportGeneration"
) {
  const resolved = workspaceId
    ? await resolveWorkspaceAiRuntime(workspaceId, purpose)
    : null;
  const apiKey = resolveAnthropicApiKey({
    useWorkspaceApiKey: resolved?.useWorkspaceApiKey,
    workspaceApiKeyEncrypted: resolved?.workspaceApiKeyEncrypted,
  });

  if (!apiKey) {
    throw new Error(
      getAnthropicApiKeyConfigurationError({
        useWorkspaceApiKey: resolved?.useWorkspaceApiKey,
        workspaceApiKeyEncrypted: resolved?.workspaceApiKeyEncrypted,
      }) ?? "Anthropic API key is not configured."
    );
  }

  const apiKeyFormatError = getAnthropicApiKeyFormatError(apiKey);
  if (apiKeyFormatError) {
    throw new Error(apiKeyFormatError);
  }

  if (resolved && resolved.provider !== "anthropic") {
    throw new Error(`Unsupported AI provider configured for runtime analysis: ${resolved.provider}`);
  }

  return {
    client: new Anthropic({ apiKey }),
    runtime: resolved,
  };
}

export async function runAnalysis(
  workspaceId: string | undefined,
  productName: string,
  docText: string
): Promise<AnalysisResult> {
  const truncated = docText.slice(0, 50_000);
  const { client, runtime } = await getAnthropicRuntimeConfig(
    workspaceId,
    "featureExtraction"
  );

  const stream = client.messages.stream({
    model: runtime?.model ?? AI_CONFIG_DEFAULTS.featureExtractionModel,
    max_tokens: runtime?.maxTokens ?? AI_CONFIG_DEFAULTS.maxTokens,
    temperature: runtime?.temperature ?? AI_CONFIG_DEFAULTS.temperature,
    thinking: { type: "adaptive" },
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Analyze this product documentation for "${productName}" and identify all workflow features and their agentic readiness.

Return a JSON object matching exactly this schema:
{
  "product_name": "string",
  "summary": "string (2-3 sentences)",
  "industry": "string",
  "modules": ["string"],
  "features": [
    {
      "id": 1,
      "module": "string",
      "name": "string",
      "status": "none|partial|agentic",
      "current": "string — current state description",
      "gap": "string — what is missing for full agentic capability",
      "recommendation": "string — specific AI recommendation",
      "agent_type": "string — type of agent needed (e.g. Orchestrator, Retrieval, Processing)",
      "impact": ["string tag"],
      "hours_saved_weekly": 0,
      "complexity": "Low|Medium|High",
      "scores": {
        "repeatability": 0,
        "roi": 0,
        "dataAvail": 0,
        "risk": 0
      }
    }
  ]
}

Scores are integers 0-100. Identify as many distinct features as exist in the documentation.

Documentation:
${truncated}`,
      },
    ],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from analysis");
  }

  return parseJsonSafely<AnalysisResult>(textBlock.text);
}

export async function runRoadmap(
  workspaceId: string | undefined,
  productName: string,
  features: AnalysisFeature[]
): Promise<RoadmapResult> {
  const featureSummary = features.map((f) => ({
    name: f.name,
    module: f.module,
    status: f.status,
    complexity: f.complexity,
    scores: f.scores,
    hours_saved_weekly: f.hours_saved_weekly,
  }));
  const { client, runtime } = await getAnthropicRuntimeConfig(
    workspaceId,
    "reportGeneration"
  );

  const stream = client.messages.stream({
    model: runtime?.model ?? AI_CONFIG_DEFAULTS.reportGenerationModel,
    max_tokens: Math.min(runtime?.maxTokens ?? AI_CONFIG_DEFAULTS.maxTokens, 4000),
    temperature: runtime?.temperature ?? AI_CONFIG_DEFAULTS.temperature,
    thinking: { type: "adaptive" },
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Based on these ${features.length} analyzed features for "${productName}", create an implementation roadmap.

Features:
${JSON.stringify(featureSummary, null, 2)}

Return a JSON object matching exactly this schema:
{
  "exec_summary": "string — 2-3 sentence executive summary",
  "total_effort_weeks": 16,
  "roi_projection": "string — projected ROI description",
  "time_savings_weekly": 40,
  "phases": [
    {
      "phase": 1,
      "title": "string",
      "duration_weeks": 4,
      "features": ["feature name strings from the list above"],
      "outcome": "string — what is achieved",
      "effort": "Low|Medium|High",
      "dependencies": "string — what is needed first"
    }
  ],
  "risks": [
    {
      "risk": "string",
      "mitigation": "string",
      "severity": "Low|Medium|High"
    }
  ],
  "quick_wins": ["string — feature names or descriptions achievable in < 2 weeks"],
  "kpis": [
    {
      "metric": "string",
      "baseline": "string",
      "target": "string",
      "timeline": "string",
      "owner": "string"
    }
  ],
  "investment_estimate": "string",
  "break_even_months": 6
}

Create 3-4 phases: quick wins first, then high-ROI features, then complex integrations.`,
      },
    ],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from roadmap");
  }

  return parseJsonSafely<RoadmapResult>(textBlock.text);
}
