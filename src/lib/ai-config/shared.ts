import { z } from "zod";

export const AI_PROVIDER_OPTIONS = [
  { value: "anthropic", label: "Anthropic" },
] as const;

export type AIProvider = (typeof AI_PROVIDER_OPTIONS)[number]["value"];

export const AI_MODEL_OPTIONS = {
  anthropic: [
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  ],
} as const;

export const AI_CONFIG_DEFAULTS = {
  provider: "anthropic",
  featureExtractionModel: "claude-opus-4-6",
  summarizationModel: "claude-opus-4-6",
  reportGenerationModel: "claude-opus-4-6",
  temperature: 1.0,
  maxTokens: 8000,
  useWorkspaceApiKey: false,
  promptVersion: "v1",
} as const;

const providerValues = AI_PROVIDER_OPTIONS.map((option) => option.value);

export const workspaceAIConfigWriteSchema = z.object({
  provider: z.enum(providerValues as [string, ...string[]]).optional(),
  featureExtractionModel: z.string().trim().min(1).max(128).optional(),
  summarizationModel: z.string().trim().min(1).max(128).optional(),
  reportGenerationModel: z.string().trim().min(1).max(128).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(256).max(32768).optional(),
  useWorkspaceApiKey: z.boolean().optional(),
  workspaceApiKeyEncrypted: z.string().max(512).nullable().optional(),
  promptVersion: z.string().trim().min(1).max(32).optional(),
});

export type EffectiveAIConfig = {
  provider: string;
  featureExtractionModel: string;
  summarizationModel: string;
  reportGenerationModel: string;
  temperature: number;
  maxTokens: number;
  useWorkspaceApiKey: boolean;
  workspaceApiKeyEncrypted: string | null;
  promptVersion: string;
};

export type AIRuntimePurpose =
  | "featureExtraction"
  | "summarization"
  | "reportGeneration";

export type AIConfigUpdateInput = Partial<{
  provider: string;
  featureExtractionModel: string;
  summarizationModel: string;
  reportGenerationModel: string;
  temperature: number;
  maxTokens: number;
  useWorkspaceApiKey: boolean;
  workspaceApiKeyEncrypted: string | null;
  promptVersion: string;
}>;

export const effectiveAIConfigSchema = z
  .object({
    provider: z.enum(providerValues as [string, ...string[]]),
    featureExtractionModel: z.string().trim().min(1).max(128),
    summarizationModel: z.string().trim().min(1).max(128),
    reportGenerationModel: z.string().trim().min(1).max(128),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(256).max(32768),
    useWorkspaceApiKey: z.boolean(),
    workspaceApiKeyEncrypted: z.string().max(512).nullable(),
    promptVersion: z.string().trim().min(1).max(32),
  })
  .superRefine((value, ctx) => {
    const allowedModels: string[] = AI_MODEL_OPTIONS[value.provider as AIProvider].map(
      (option) => option.value
    );

    for (const [field, label] of [
      ["featureExtractionModel", "Feature extraction model"],
      ["summarizationModel", "Summarization model"],
      ["reportGenerationModel", "Report generation model"],
    ] as const) {
      if (!allowedModels.includes(value[field])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${label} is not available for ${value.provider}.`,
        });
      }
    }
  });

export function mergeWorkspaceAIConfig(
  base: EffectiveAIConfig,
  input: AIConfigUpdateInput
): EffectiveAIConfig {
  return effectiveAIConfigSchema.parse({
    ...base,
    ...input,
  });
}

export function getPurposeModel(
  config: EffectiveAIConfig,
  purpose: AIRuntimePurpose
) {
  if (purpose === "featureExtraction") {
    return config.featureExtractionModel;
  }

  if (purpose === "summarization") {
    return config.summarizationModel;
  }

  return config.reportGenerationModel;
}
