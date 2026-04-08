"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  membershipId: string;
  currentRole: string;
};

export function MemberActions({ slug, membershipId, currentRole }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateRole() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/members/${membershipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update role");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember() {
    const confirmed = window.confirm("Remove this member?");
    if (!confirmed) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/members/${membershipId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to remove member");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="OWNER">OWNER</option>
        </select>

        <button
          type="button"
          onClick={updateRole}
          disabled={loading}
          className="rounded border px-3 py-1 text-sm"
        >
          Update role
        </button>

        <button
          type="button"
          onClick={removeMember}
          disabled={loading}
          className="rounded border px-3 py-1 text-sm"
        >
          Remove
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
