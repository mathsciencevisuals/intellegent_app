"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  sourceId: string;
};

export function SourceSyncButton({ slug, sourceId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/workspaces/${slug}/sources/${sourceId}/sync`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Sync failed.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (syncError) {
      console.error("Source sync failed:", syncError);
      setError("Something went wrong during sync.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Run sync"}
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
