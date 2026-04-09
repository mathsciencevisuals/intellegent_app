"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GoalOption = {
  id: string;
  label: string;
  description: string;
};

const GOALS: GoalOption[] = [
  {
    id: "dedupe",
    label: "Reduce duplicate work",
    description: "Spot overlapping ideas and merge similar requests faster.",
  },
  {
    id: "coverage",
    label: "Find coverage gaps",
    description: "See what customer or roadmap themes are not represented yet.",
  },
  {
    id: "repository",
    label: "Build a feature repository",
    description: "Create a reviewable source of truth from scattered documents.",
  },
] as const;

const SOURCE_TYPES = [
  { value: "MANUAL_UPLOAD", label: "Manual Upload" },
  { value: "JIRA", label: "Jira" },
  { value: "AZURE_DEVOPS", label: "Azure DevOps" },
  { value: "CONFLUENCE", label: "Confluence" },
  { value: "NOTION", label: "Notion" },
  { value: "SHAREPOINT", label: "SharePoint" },
] as const;

const STEPS = ["Workspace", "Goals", "Source", "First scan"] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [goal, setGoal] = useState<string>(GOALS[0].id);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] =
    useState<(typeof SOURCE_TYPES)[number]["value"]>("MANUAL_UPLOAD");
  const [sourceFrequency, setSourceFrequency] = useState<"MANUAL" | "DAILY" | "WEEKLY">(
    "MANUAL"
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourcePlaceholder = useMemo(() => {
    switch (sourceType) {
      case "JIRA":
        return "Jira product backlog";
      case "AZURE_DEVOPS":
        return "ADO feature board";
      case "CONFLUENCE":
        return "Confluence product docs";
      case "NOTION":
        return "Notion product wiki";
      case "SHAREPOINT":
        return "SharePoint requirement library";
      default:
        return "Manual intake";
    }
  }, [sourceType]);

  function nextStep() {
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function previousStep() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function createWorkspace() {
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: workspaceName.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : "Failed to create workspace."
      );
    }

    return data.workspace as { id: string; slug: string; name: string };
  }

  async function createSource(slug: string) {
    const response = await fetch(`/api/workspaces/${slug}/sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: sourceName.trim(),
        type: sourceType,
        syncFrequency: sourceFrequency,
        connectionNotes: `Primary onboarding goal: ${
          GOALS.find((item) => item.id === goal)?.label ?? "Not specified"
        }`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.error === "string" ? data.error : "Failed to create source."
      );
    }

    return data.source as { id: string; name: string };
  }

  async function uploadFirstDocument(slug: string, sourceId: string) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceId", sourceId);

    const response = await fetch(`/api/workspaces/${slug}/documents`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.error === "string"
          ? data.error
          : "Failed to upload the first document."
      );
    }
  }

  async function finishOnboarding() {
    setLoading(true);
    setError(null);

    try {
      const workspace = await createWorkspace();
      const source = await createSource(workspace.slug);
      await uploadFirstDocument(workspace.slug, source.id);

      router.push(
        file
          ? `/workspaces/${workspace.slug}/features`
          : `/workspaces/${workspace.slug}/sources`
      );
      router.refresh();
    } catch (submitError) {
      console.error("Onboarding failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong during onboarding."
      );
      setLoading(false);
    }
  }

  function canContinueCurrentStep() {
    if (step === 0) {
      return workspaceName.trim().length >= 2;
    }

    if (step === 1) {
      return Boolean(goal);
    }

    if (step === 2) {
      return sourceName.trim().length >= 2;
    }

    return true;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              index === step
                ? "border-neutral-900 bg-neutral-900 text-white"
                : index < step
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-neutral-200 bg-white text-neutral-500"
            }`}
          >
            <div className="text-xs uppercase tracking-[0.16em]">
              Step {index + 1}
            </div>
            <div className="mt-1 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        {step === 0 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Create your workspace
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Start with the team or product area you want this repository to represent.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700" htmlFor="workspace-name">
                Workspace name
              </label>
              <input
                id="workspace-name"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Core product team"
                maxLength={100}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Choose the first goal
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                This helps frame the initial source setup and what success looks like.
              </p>
            </div>

            <div className="grid gap-3">
              {GOALS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setGoal(option.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    goal === option.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div
                    className={`mt-1 text-sm ${
                      goal === option.id ? "text-neutral-200" : "text-neutral-500"
                    }`}
                  >
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Connect the first source
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Create the first intake channel you want feature extraction to start from.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700" htmlFor="source-type">
                  Source type
                </label>
                <select
                  id="source-type"
                  value={sourceType}
                  onChange={(event) =>
                    setSourceType(event.target.value as (typeof SOURCE_TYPES)[number]["value"])
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {SOURCE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700" htmlFor="source-frequency">
                  Sync frequency
                </label>
                <select
                  id="source-frequency"
                  value={sourceFrequency}
                  onChange={(event) =>
                    setSourceFrequency(
                      event.target.value as "MANUAL" | "DAILY" | "WEEKLY"
                    )
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700" htmlFor="source-name">
                Source name
              </label>
              <input
                id="source-name"
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                placeholder={sourcePlaceholder}
                maxLength={80}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Run the first scan
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Upload one starting document now. The app will create the workspace, source, first extraction job, and feature candidates in one flow.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              <div className="font-medium text-neutral-900">Setup summary</div>
              <div className="mt-2">Workspace: {workspaceName || "Not set"}</div>
              <div className="mt-1">
                Goal: {GOALS.find((option) => option.id === goal)?.label || "Not set"}
              </div>
              <div className="mt-1">
                Source: {sourceName || "Not set"} ({sourceType})
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700" htmlFor="onboarding-file">
                First document
              </label>
              <input
                id="onboarding-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-neutral-500">
                Optional, but recommended. If skipped, onboarding will finish on the Sources page.
              </p>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 0 || loading}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinueCurrentStep() || loading}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={loading}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Finish onboarding"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
