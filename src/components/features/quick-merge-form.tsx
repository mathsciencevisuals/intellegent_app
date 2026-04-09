"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Candidate = {
  id: string;
  title: string;
  scoreLabel: string;
};

type Props = {
  slug: string;
  featureId: string;
  candidates: Candidate[];
};

export function QuickMergeForm({ slug, featureId, candidates }: Props) {
  const router = useRouter();
  const [targetFeatureId, setTargetFeatureId] = useState(candidates[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (candidates.length === 0) {
    return null;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!targetFeatureId) {
      setError("Choose a merge target.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/workspaces/${slug}/features/${featureId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "merge",
              targetFeatureId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(typeof data?.error === "string" ? data.error : "Merge failed.");
          return;
        }

        router.refresh();
      } catch (mergeError) {
        console.error("Quick merge failed:", mergeError);
        setError("Something went wrong while merging.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select
          value={targetFeatureId}
          onChange={(event) => setTargetFeatureId(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs"
        >
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title} ({candidate.scoreLabel})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border px-2 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
        >
          {isPending ? "Merging..." : "Merge"}
        </button>
      </div>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </form>
  );
}
