"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  inviteId: string;
};

export function InviteActions({ inviteId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: "accept" | "decline") {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to process invite");
        setLoading(false);
        return;
      }

      if (action === "accept" && data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction("accept")}
          className="rounded-xl bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Accept
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction("decline")}
          className="rounded-xl border px-3 py-1 text-sm disabled:opacity-50"
        >
          Decline
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
