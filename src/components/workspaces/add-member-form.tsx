"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export function AddMemberForm({ slug }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${slug}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to add member or create invite");
        setLoading(false);
        return;
      }

      if (data?.mode === "member_added") {
        setSuccess("Existing user added to workspace.");
      } else if (data?.mode === "invite_created") {
        setSuccess("Invite created for this email.");
      } else {
        setSuccess("Action completed successfully.");
      }

      setEmail("");
      setRole("MEMBER");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">User email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Enter email to add or invite"
          required
        />
        <p className="mt-1 text-xs text-neutral-500">
          Existing users are added immediately. New emails receive a pending invite.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="OWNER">OWNER</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Add member / Send invite"}
      </button>
    </form>
  );
}
