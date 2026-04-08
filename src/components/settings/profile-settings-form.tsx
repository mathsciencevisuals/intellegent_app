"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  initialName: string;
  email: string;
};

export function ProfileSettingsForm({ initialName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "profile",
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to update profile");
        return;
      }

      setSuccess(data?.message || "Profile updated.");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
            minLength={2}
            maxLength={80}
            required
          />
          <p className="mt-1 text-xs text-neutral-500">
            This name is shown throughout the workspace UI.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500 outline-none"
            disabled
          />
          <p className="mt-1 text-xs text-neutral-500">
            Email changes are not enabled in this release.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <Button type="submit" disabled={loading} className="rounded-xl">
        {loading ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
