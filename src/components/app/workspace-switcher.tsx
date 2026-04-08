"use client";

import { useRouter } from "next/navigation";

type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type Props = {
  workspaces: WorkspaceOption[];
  currentSlug?: string;
};

export function WorkspaceSwitcher({ workspaces, currentSlug }: Props) {
  const router = useRouter();

  function onChange(value: string) {
    if (!value) return;
    router.push(`/workspaces/${value}`);
  }

  return (
    <div className="min-w-[220px]">
      <label className="mb-1 block text-xs font-medium text-neutral-500">
        Workspace
      </label>
      <select
        value={currentSlug ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Select workspace
        </option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.slug}>
            {workspace.name} ({workspace.role})
          </option>
        ))}
      </select>
    </div>
  );
}
