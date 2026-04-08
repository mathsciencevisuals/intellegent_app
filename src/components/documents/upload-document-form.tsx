"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export function UploadDocumentForm({ slug }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedStorageKey = storageKey.trim();

    if (trimmedTitle.length < 2) {
      setError("Document title must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/${slug}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            storageKey: trimmedStorageKey,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof data?.error === "string") {
            setError(data.error);
            return;
          }

          if (data?.error?.fieldErrors?.title?.[0]) {
            setError(data.error.fieldErrors.title[0]);
            return;
          }

          setError("Failed to create document.");
          return;
        }

        setTitle("");
        setStorageKey("");
        setSuccess("Document added successfully.");
        router.refresh();
      } catch (error) {
        console.error("Create document failed:", error);
        setError("Something went wrong while creating the document.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="document-title"
            className="text-sm font-medium text-neutral-700"
          >
            Document title
          </label>
          <input
            id="document-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            required
            minLength={2}
            maxLength={150}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="storage-key"
            className="text-sm font-medium text-neutral-700"
          >
            Storage key
          </label>
          <input
            id="storage-key"
            name="storageKey"
            type="text"
            value={storageKey}
            onChange={(e) => setStorageKey(e.target.value)}
            placeholder="Optional file/storage reference"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            maxLength={255}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add document"}
      </button>
    </form>
  );
}
