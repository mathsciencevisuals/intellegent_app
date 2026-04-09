"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buildSavedViewHref } from "@/lib/saved-views";

type SavedView = {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string | Date;
};

type Props = {
  slug: string;
  scope: "FEATURES" | "REPORTS";
  basePath: string;
  currentFilters: Record<string, string>;
  savedViews: SavedView[];
};

export function SavedViewsPanel({
  slug,
  scope,
  basePath,
  currentFilters,
  savedViews,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/${slug}/saved-views`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            scope,
            filters: currentFilters,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setError(data.error);
            return;
          }

          setError("Failed to save view.");
          return;
        }

        setName("");
        router.refresh();
      } catch (createError) {
        console.error("Create saved view failed:", createError);
        setError("Something went wrong while saving the view.");
      }
    });
  }

  function handleDelete(viewId: string) {
    setError(null);
    setDeletingId(viewId);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/${slug}/saved-views/${viewId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(typeof data?.error === "string" ? data.error : "Failed to delete view.");
          setDeletingId(null);
          return;
        }

        router.refresh();
      } catch (deleteError) {
        console.error("Delete saved view failed:", deleteError);
        setError("Something went wrong while deleting the view.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={
            hasActiveFilters ? "Save this filter set as a view" : "Save the current page state"
          }
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          minLength={2}
          maxLength={60}
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save view"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {savedViews.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
          No saved views yet.
        </div>
      ) : (
        <div className="space-y-3">
          {savedViews.map((view) => (
            <div
              key={view.id}
              className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium text-neutral-900">{view.name}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {Object.keys(view.filters).length === 0
                    ? "No filters saved"
                    : Object.entries(view.filters)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" • ")}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildSavedViewHref(basePath, view.filters)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(view.id)}
                  disabled={deletingId === view.id}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
                >
                  {deletingId === view.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
