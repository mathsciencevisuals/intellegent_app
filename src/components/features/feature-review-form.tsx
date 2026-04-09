"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type FeatureStatus = "CANDIDATE" | "APPROVED" | "MERGED" | "REJECTED";
type ReviewStatus = "CANDIDATE" | "APPROVED" | "REJECTED";

type MergeTarget = {
  id: string;
  title: string;
  status: Exclude<FeatureStatus, "MERGED">;
};

type Props = {
  slug: string;
  featureId: string;
  initialStatus: FeatureStatus;
  initialOwner: string;
  initialTags: string[];
  mergeTargets: MergeTarget[];
};

export function FeatureReviewForm({
  slug,
  featureId,
  initialStatus,
  initialOwner,
  initialTags,
  mergeTargets,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus>(
    initialStatus === "MERGED" ? "APPROVED" : initialStatus
  );
  const [owner, setOwner] = useState(initialOwner);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMerging, startMergeTransition] = useTransition();

  const normalizedTags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [tagsInput]
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
              action: "review",
              status,
              owner,
              tags: normalizedTags,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setError(data.error);
            return;
          }

          setError("Failed to update feature.");
          return;
        }

        router.refresh();
      } catch (submitError) {
        console.error("Feature update failed:", submitError);
        setError("Something went wrong while updating the feature.");
      }
    });
  }

  function handleQuickStatus(nextStatus: ReviewStatus) {
    setStatus(nextStatus);
  }

  function onMerge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMergeError(null);

    if (!mergeTargetId) {
      setMergeError("Choose a target feature to merge into.");
      return;
    }

    startMergeTransition(async () => {
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
              targetFeatureId: mergeTargetId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setMergeError(data.error);
            return;
          }

          setMergeError("Failed to merge feature.");
          return;
        }

        router.push(`/workspaces/${slug}/features/${mergeTargetId}`);
        router.refresh();
      } catch (mergeRequestError) {
        console.error("Feature merge failed:", mergeRequestError);
        setMergeError("Something went wrong while merging the feature.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="feature-status">
            Status
          </label>
          <select
            id="feature-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ReviewStatus)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="CANDIDATE">Candidate</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickStatus("APPROVED")}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatus("REJECTED")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatus("CANDIDATE")}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700"
          >
            Reset to candidate
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="feature-owner">
            Owner
          </label>
          <input
            id="feature-owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Product manager or team"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="feature-tags">
            Tags
          </label>
          <input
            id="feature-tags"
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            placeholder="roadmap, reporting, onboarding"
          />
          <p className="text-xs text-neutral-500">Separate tags with commas.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save review"}
        </button>
      </form>

      <form onSubmit={onMerge} className="space-y-4 border-t pt-4">
        <div>
          <div className="text-sm font-medium text-neutral-700">Merge candidate</div>
          <p className="mt-1 text-xs text-neutral-500">
            Move this feature&apos;s traceability into another reviewed item and mark this one as merged.
          </p>
        </div>

        <select
          value={mergeTargetId}
          onChange={(event) => setMergeTargetId(event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Choose merge target</option>
          {mergeTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.title} ({target.status})
            </option>
          ))}
        </select>

        {mergeError ? <p className="text-sm text-red-600">{mergeError}</p> : null}

        <button
          type="submit"
          disabled={isMerging || mergeTargets.length === 0}
          className="rounded-xl border px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
        >
          {isMerging ? "Merging..." : "Merge into selected feature"}
        </button>
      </form>
    </div>
  );
}
