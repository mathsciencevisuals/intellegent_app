import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { normalizeAnthropicApiKey } from "@/lib/ai-config/provider-runtime";
import { prisma } from "@/lib/prisma";
import {
  AI_CONFIG_DEFAULTS,
  type AIConfigUpdateInput,
  type EffectiveAIConfig,
  effectiveAIConfigSchema,
  getPurposeModel,
  mergeWorkspaceAIConfig,
  type AIRuntimePurpose,
} from "@/lib/ai-config/shared";

export class WorkspaceAIConfigStorageUnavailableError extends Error {
  constructor(message = "Workspace AI config storage is unavailable until migrations are applied.") {
    super(message);
    this.name = "WorkspaceAIConfigStorageUnavailableError";
  }
}

function isMissingSchemaError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  return /does not exist in the current database|table .* does not exist/i.test(error.message);
}

export async function getWorkspaceAIConfig(workspaceId: string) {
  try {
    return await prisma.workspaceAIConfig.findUnique({ where: { workspaceId } });
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }
}

export async function updateWorkspaceAIConfig(
  workspaceId: string,
  data: AIConfigUpdateInput
) {
  try {
    const current = await resolveWorkspaceAiConfig(workspaceId);
    const merged = mergeWorkspaceAIConfig(current, {
      ...data,
      workspaceApiKeyEncrypted:
        data.workspaceApiKeyEncrypted === undefined
          ? undefined
          : normalizeAnthropicApiKey(data.workspaceApiKeyEncrypted),
    });

    return await prisma.workspaceAIConfig.upsert({
      where: { workspaceId },
      create: { workspaceId, ...merged },
      update: merged,
    });
  } catch (error) {
    if (isMissingSchemaError(error)) {
      throw new WorkspaceAIConfigStorageUnavailableError();
    }

    throw error;
  }
}

export async function resolveWorkspaceAiConfig(
  workspaceId: string
): Promise<EffectiveAIConfig> {
  const config = await getWorkspaceAIConfig(workspaceId);

  return effectiveAIConfigSchema.parse({
    provider: config?.provider ?? AI_CONFIG_DEFAULTS.provider,
    featureExtractionModel:
      config?.featureExtractionModel ?? AI_CONFIG_DEFAULTS.featureExtractionModel,
    summarizationModel:
      config?.summarizationModel ?? AI_CONFIG_DEFAULTS.summarizationModel,
    reportGenerationModel:
      config?.reportGenerationModel ?? AI_CONFIG_DEFAULTS.reportGenerationModel,
    temperature: config?.temperature ?? AI_CONFIG_DEFAULTS.temperature,
    maxTokens: config?.maxTokens ?? AI_CONFIG_DEFAULTS.maxTokens,
    useWorkspaceApiKey:
      config?.useWorkspaceApiKey ?? AI_CONFIG_DEFAULTS.useWorkspaceApiKey,
    workspaceApiKeyEncrypted: config?.workspaceApiKeyEncrypted ?? null,
    promptVersion: config?.promptVersion ?? AI_CONFIG_DEFAULTS.promptVersion,
  });
}

export async function resolveEffectiveConfig(workspaceId: string) {
  return resolveWorkspaceAiConfig(workspaceId);
}

export async function resolveWorkspaceAiRuntime(
  workspaceId: string,
  purpose: AIRuntimePurpose
) {
  const config = await resolveWorkspaceAiConfig(workspaceId);

  return {
    config,
    provider: config.provider,
    model: getPurposeModel(config, purpose),
    promptVersion: config.promptVersion,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    useWorkspaceApiKey: config.useWorkspaceApiKey,
    workspaceApiKeyEncrypted: config.workspaceApiKeyEncrypted,
  };
}
