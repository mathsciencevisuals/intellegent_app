"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  initialEmailNotificationsEnabled: boolean;
  initialWeeklyDigestEnabled: boolean;
  initialWorkspaceListDensity: "COMFORTABLE" | "COMPACT";
};

export function PreferencesSettingsForm({
  initialEmailNotificationsEnabled,
  initialWeeklyDigestEnabled,
  initialWorkspaceListDensity,
}: Props) {
  const router = useRouter();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    initialEmailNotificationsEnabled
  );
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(
    initialWeeklyDigestEnabled
  );
  const [workspaceListDensity, setWorkspaceListDensity] = useState(
    initialWorkspaceListDensity
  );
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
          action: "preferences",
          emailNotificationsEnabled,
          weeklyDigestEnabled,
          workspaceListDensity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to update preferences");
        return;
      }

      setSuccess(data?.message || "Preferences updated.");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-4">
        <label className="flex items-start gap-3 rounded-2xl border p-4">
          <input
            type="checkbox"
            checked={emailNotificationsEnabled}
            onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />
          <div>
            <div className="font-medium text-neutral-900">Email notifications</div>
            <div className="mt-1 text-sm text-neutral-500">
              Send account email for invites and document processing updates.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border p-4">
          <input
            type="checkbox"
            checked={weeklyDigestEnabled}
            onChange={(event) => setWeeklyDigestEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />
          <div>
            <div className="font-medium text-neutral-900">Weekly digest</div>
            <div className="mt-1 text-sm text-neutral-500">
              Keep a low-frequency summary enabled even when instant notifications are off.
            </div>
          </div>
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Workspace list density
          </label>
          <select
            value={workspaceListDensity}
            onChange={(event) =>
              setWorkspaceListDensity(event.target.value as "COMFORTABLE" | "COMPACT")
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
          >
            <option value="COMFORTABLE">Comfortable</option>
            <option value="COMPACT">Compact</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Saves your preferred browsing density for future workspace list rendering.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <Button type="submit" disabled={loading} className="rounded-xl">
        {loading ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
