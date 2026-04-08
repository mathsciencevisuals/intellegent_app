"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export function UploadDocumentForm({ slug }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please choose a file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/workspaces/${slug}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Upload failed");
        setLoading(false);
        return;
      }

      setFile(null);
      const input = document.getElementById("document-file-input") as HTMLInputElement | null;
      if (input) input.value = "";

      router.refresh();
    } catch {
      setError("Something went wrong during upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Select document
        </label>
        <input
          id="document-file-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Allowed: .txt, .pdf, .doc, .docx • Max size: 10 MB
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
