"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  documentId: string;
};

export function DocumentActions({ slug, documentId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${slug}/documents/${documentId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Delete failed");
        setDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <a
          href={`/api/workspaces/${slug}/documents/${documentId}/download`}
          className="rounded-lg border px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Download
        </a>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
