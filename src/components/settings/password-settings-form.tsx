"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

export function PasswordSettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          action: "password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to update password");
        return;
      }

      setSuccess(data?.message || "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Current password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            New password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
            minLength={8}
            required
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Use at least 8 characters. Password changes apply on your next sign-in.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <Button type="submit" disabled={loading} className="rounded-xl">
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
