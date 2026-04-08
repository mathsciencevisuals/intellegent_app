"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type MemberOption = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  slug: string;
  members: MemberOption[];
  currentOwnerUserId: string;
};

export function TransferOwnershipForm({
  slug,
  members,
  currentOwnerUserId,
}: Props) {
  const router = useRouter();
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const eligibleMembers = members.filter(
    (member) => member.userId !== currentOwnerUserId
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!membershipId) {
      setError("Please select a member.");
      return;
    }

    const confirmed = window.confirm(
      "Transfer ownership? You will become ADMIN after this action."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "transferOwnership",
          membershipId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to transfer ownership");
        setLoading(false);
        return;
      }

      setSuccess("Ownership transferred.");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          New workspace owner
        </label>
        <select
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">Select a member</option>
          {eligibleMembers.map((member) => (
            <option key={member.membershipId} value={member.membershipId}>
              {member.name} ({member.email}) — {member.role}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <button
        type="submit"
        disabled={loading || eligibleMembers.length === 0}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Transferring..." : "Transfer ownership"}
      </button>
    </form>
  );
}
