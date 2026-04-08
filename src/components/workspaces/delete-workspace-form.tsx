"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export function DeleteWorkspaceForm({ slug }: Props) {
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (confirmSlug !== slug) {
      setError("Entered slug does not match.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this workspace permanently? This will remove members and documents from the database."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/settings`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to delete workspace");
        setLoading(false);
        return;
      }

      router.push(data?.redirectTo || "/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-red-300 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-red-700">
          Confirm workspace slug to delete
        </label>
        <input
          type="text"
          value={confirmSlug}
          onChange={(e) => setConfirmSlug(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder={slug}
        />
        <p className="mt-1 text-xs text-neutral-500">
          Type <span className="font-medium">{slug}</span> to confirm deletion.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete workspace"}
      </button>
    </form>
  );
}
