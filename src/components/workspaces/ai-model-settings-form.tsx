"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AI_MODEL_OPTIONS,
  AI_PROVIDER_OPTIONS,
  type EffectiveAIConfig,
} from "@/lib/ai-config/shared";

type Props = {
  slug: string;
  canManage: boolean;
  current: EffectiveAIConfig & {
    workspaceApiKeyEncrypted: string | null;
  };
  lastUpdatedAt: string | null;
  auditHistoryAvailable: boolean;
};

export function AIModelSettingsForm({
  slug,
  canManage,
  current,
  lastUpdatedAt,
  auditHistoryAvailable,
}: Props) {
  const router = useRouter();
  const [provider, setProvider] = useState(current.provider);
  const [featureExtractionModel, setFeatureExtractionModel] = useState(
    current.featureExtractionModel
  );
  const [summarizationModel, setSummarizationModel] = useState(
    current.summarizationModel
  );
  const [reportGenerationModel, setReportGenerationModel] = useState(
    current.reportGenerationModel
  );
  const [temperature, setTemperature] = useState(String(current.temperature));
  const [maxTokens, setMaxTokens] = useState(String(current.maxTokens));
  const [useWorkspaceApiKey, setUseWorkspaceApiKey] = useState(
    current.useWorkspaceApiKey
  );
  const [apiKey, setApiKey] = useState("");
  const [promptVersion, setPromptVersion] = useState(current.promptVersion);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">("idle");
  const [testState, setTestState] = useState<"idle" | "testing" | "success">("idle");
  const [error, setError] = useState("");
  const [testError, setTestError] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const modelOptions = useMemo(() => {
    return AI_MODEL_OPTIONS[provider as keyof typeof AI_MODEL_OPTIONS] ?? [];
  }, [provider]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setError("");
    setSaveState("saving");

    try {
      const body: Record<string, unknown> = {
        provider,
        featureExtractionModel,
        summarizationModel,
        reportGenerationModel,
        temperature: Number.parseFloat(temperature),
        maxTokens: Number.parseInt(maxTokens, 10),
        useWorkspaceApiKey,
        promptVersion,
      };

      if (useWorkspaceApiKey && apiKey.trim()) {
        body.workspaceApiKeyEncrypted = apiKey.trim();
      }

      const response = await fetch(`/api/workspaces/${slug}/ai-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Failed to save workspace AI settings"
        );
        setSaveState("idle");
        return;
      }

      setApiKey("");
      setSaveState("success");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save workspace AI settings"
      );
      setSaveState("idle");
    }
  }

  async function onTestConnection() {
    if (!canManage) {
      return;
    }

    setTestError("");
    setTestMessage("");
    setTestState("testing");

    try {
      const response = await fetch(`/api/workspaces/${slug}/ai-config/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          featureExtractionModel,
          summarizationModel,
          reportGenerationModel,
          temperature: Number.parseFloat(temperature),
          maxTokens: Number.parseInt(maxTokens, 10),
          useWorkspaceApiKey,
          promptVersion,
          ...(useWorkspaceApiKey && apiKey.trim()
            ? { workspaceApiKeyEncrypted: apiKey.trim() }
            : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setTestError(
          typeof data?.error === "string" ? data.error : "Connection test failed"
        );
        setTestState("idle");
        return;
      }

      setTestMessage(
        typeof data?.message === "string" ? data.message : "Connection succeeded."
      );
      setTestState("success");
    } catch (testConnectionError) {
      setTestError(
        testConnectionError instanceof Error
          ? testConnectionError.message
          : "Connection test failed"
      );
      setTestState("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Effective runtime
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Provider</div>
              <div className="mt-1 font-semibold text-neutral-900">{provider}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Prompt version</div>
              <div className="mt-1 font-semibold text-neutral-900">{promptVersion}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Feature extraction</div>
              <div className="mt-1 font-semibold text-neutral-900">
                {featureExtractionModel}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Summarization</div>
              <div className="mt-1 font-semibold text-neutral-900">
                {summarizationModel}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:col-span-2">
              <div className="text-sm text-neutral-500">Report generation</div>
              <div className="mt-1 font-semibold text-neutral-900">
                {reportGenerationModel}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Operational notes
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              {useWorkspaceApiKey
                ? "This workspace uses its own API key for runtime AI calls."
                : "Workspace API key is disabled. The platform default provider key will be used."}
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Last updated</div>
              <div className="mt-1 font-semibold text-neutral-900">
                {lastUpdatedAt ?? "Not configured yet"}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">Audit history</div>
              <div className="mt-1 text-sm text-neutral-700">
                {auditHistoryAvailable
                  ? "Recent audit history is available below."
                  : "No AI settings audit history is available in this workspace yet."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Provider and billing
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Choose the provider and credential source used for workspace-scoped AI
            execution.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Provider
            </label>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              disabled={!canManage}
            >
              {AI_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
              <input
                type="checkbox"
                checked={useWorkspaceApiKey}
                onChange={(event) => setUseWorkspaceApiKey(event.target.checked)}
                className="h-4 w-4"
                disabled={!canManage}
              />
              Use workspace API key
            </label>
            <p className="mt-2 text-sm text-neutral-600">
              Disable this to use the platform default key for the selected provider.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Workspace API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              placeholder={
                current.workspaceApiKeyEncrypted ? "Configured. Enter a new value to replace." : "sk-ant-..."
              }
              autoComplete="off"
              disabled={!useWorkspaceApiKey || !canManage}
            />
          </div>
          <button
            type="button"
            onClick={onTestConnection}
            disabled={testState === "testing" || !canManage}
            className="self-end rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
          >
            {testState === "testing" ? "Testing..." : "Test connection"}
          </button>
        </div>

        {!useWorkspaceApiKey ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Workspace API key is disabled. The system default provider key will be used.
          </div>
        ) : null}

        {testError ? (
          <p className="mt-4 text-sm text-red-600">{testError}</p>
        ) : null}
        {testMessage ? (
          <p className="mt-4 text-sm text-emerald-700">{testMessage}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Model selection
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Configure separate models for extraction, summarization, and report
            generation.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Feature extraction model
            </label>
            <select
              value={featureExtractionModel}
              onChange={(event) => setFeatureExtractionModel(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              disabled={!canManage}
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-neutral-500">
              Used by pipeline feature extraction runs.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Summarization model
            </label>
            <select
              value={summarizationModel}
              onChange={(event) => setSummarizationModel(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              disabled={!canManage}
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Report generation model
            </label>
            <select
              value={reportGenerationModel}
              onChange={(event) => setReportGenerationModel(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              disabled={!canManage}
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Runtime defaults
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Define default temperature, token budget, and prompt version used for
            runtime execution metadata.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Temperature
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              min={0}
              max={2}
              step={0.1}
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Max tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              min={256}
              max={32768}
              step={256}
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Prompt version
            </label>
            <input
              type="text"
              value={promptVersion}
              onChange={(event) => setPromptVersion(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              disabled={!canManage}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Safety and audit
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Runtime model changes are recorded on each analysis run. Audit history is
            shown here when the backend provides it.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            The runtime pipeline records provider, model, prompt version, temperature,
            and token budget for each run.
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            {auditHistoryAvailable
              ? "Recent AI settings changes are available in the audit history feed."
              : "Recent AI settings audit history is not available in this workspace yet."}
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saveState === "success" ? (
        <p className="text-sm text-emerald-700">Workspace AI settings saved.</p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saveState === "saving" || !canManage}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saveState === "saving" ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
