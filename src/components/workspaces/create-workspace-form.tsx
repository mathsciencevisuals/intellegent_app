"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError("Workspace name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/workspaces", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setError(data.error);
            return;
          }

          if (data?.error?.fieldErrors?.name?.[0]) {
            setError(data.error.fieldErrors.name[0]);
            return;
          }

          setError("Failed to create workspace.");
          return;
        }

        setName("");

        if (data?.redirectTo) {
          router.push(data.redirectTo);
          router.refresh();
          return;
        }

        if (data?.workspace?.slug) {
          router.push(`/workspaces/${data.workspace.slug}`);
          router.refresh();
          return;
        }

        router.refresh();
      } catch (error) {
        console.error("Create workspace failed:", error);
        setError("Something went wrong while creating the workspace.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="workspace-name"
          className="text-sm font-medium text-neutral-700"
        >
          Workspace name
        </label>

        <input
          id="workspace-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          placeholder="Enter workspace name"
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create workspace"}
      </button>
    </form>
  );
}
