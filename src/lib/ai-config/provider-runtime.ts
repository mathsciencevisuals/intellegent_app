import "server-only";

type AnthropicCredentialSource = {
  useWorkspaceApiKey?: boolean;
  workspaceApiKeyEncrypted?: string | null;
};

export function normalizeAnthropicApiKey(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveAnthropicApiKey(source: AnthropicCredentialSource) {
  const workspaceKey = source.useWorkspaceApiKey
    ? normalizeAnthropicApiKey(source.workspaceApiKeyEncrypted)
    : null;

  return workspaceKey ?? normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicApiKeyConfigurationError(
  source: AnthropicCredentialSource
) {
  const workspaceKey = normalizeAnthropicApiKey(source.workspaceApiKeyEncrypted);
  const envKey = normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);

  if (source.useWorkspaceApiKey && !workspaceKey) {
    return "Workspace API key is enabled, but no workspace key is configured.";
  }

  if (!envKey) {
    return "ANTHROPIC_API_KEY is not set for the server runtime.";
  }

  return null;
}

export function getAnthropicApiKeyFormatError(apiKey: string) {
  if (!apiKey.startsWith("sk-ant-")) {
    return "Anthropic API keys must start with sk-ant-.";
  }

  return null;
}
