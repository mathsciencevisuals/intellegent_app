"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  documentId: string;
  label?: string;
  className?: string;
};

export function RunExtractionJobButton({
  slug,
  documentId,
  label = "Run extraction",
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/workspaces/${slug}/extraction-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to run extraction.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (jobError) {
      console.error("Create extraction job failed:", jobError);
      setError("Something went wrong while running extraction.");
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
        className={
          className ??
          "rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        }
      >
        {loading ? "Running..." : label}
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
