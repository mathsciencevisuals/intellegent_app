"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  currentName: string;
};

export function RenameWorkspaceForm({ slug, currentName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "rename",
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to rename workspace");
        setLoading(false);
        return;
      }

      setSuccess("Workspace updated.");

      if (data.slug && data.slug !== slug) {
        router.push(`/workspaces/${data.slug}/settings`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Workspace name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Rename workspace"}
      </button>
    </form>
  );
}
