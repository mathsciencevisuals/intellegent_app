"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

const SOURCE_OPTIONS = [
  { value: "MANUAL_UPLOAD", label: "Manual Upload" },
  { value: "JIRA", label: "Jira" },
  { value: "AZURE_DEVOPS", label: "Azure DevOps" },
  { value: "CONFLUENCE", label: "Confluence" },
  { value: "NOTION", label: "Notion" },
  { value: "SHAREPOINT", label: "SharePoint" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
] as const;

export function CreateSourceForm({ slug }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>(
    "MANUAL_UPLOAD"
  );
  const [syncFrequency, setSyncFrequency] = useState<
    (typeof FREQUENCY_OPTIONS)[number]["value"]
  >("MANUAL");
  const [connectionNotes, setConnectionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/${slug}/sources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            type,
            syncFrequency,
            connectionNotes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setError(data.error);
            return;
          }

          setError("Failed to create source.");
          return;
        }

        setName("");
        setType("MANUAL_UPLOAD");
        setSyncFrequency("MANUAL");
        setConnectionNotes("");
        router.refresh();
      } catch (submitError) {
        console.error("Create source failed:", submitError);
        setError("Something went wrong while creating the source.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700" htmlFor="source-name">
          Source name
        </label>
        <input
          id="source-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          placeholder="Customer feedback hub"
          required
          minLength={2}
          maxLength={80}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="source-type">
            Source type
          </label>
          <select
            id="source-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as (typeof SOURCE_OPTIONS)[number]["value"])
            }
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="source-frequency"
          >
            Sync frequency
          </label>
          <select
            id="source-frequency"
            value={syncFrequency}
            onChange={(event) =>
              setSyncFrequency(
                event.target.value as (typeof FREQUENCY_OPTIONS)[number]["value"]
              )
            }
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700" htmlFor="source-notes">
          Connection notes
        </label>
        <textarea
          id="source-notes"
          value={connectionNotes}
          onChange={(event) => setConnectionNotes(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          placeholder="Optional notes, endpoints, or scope details for this source."
          maxLength={200}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create source"}
      </button>
    </form>
  );
}
