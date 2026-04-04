'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type WorkspaceOption = {
  workspaceId: string;
  role: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

export function WorkspaceSwitcher({
  currentWorkspaceId,
  workspaces,
}: {
  currentWorkspaceId: string;
  workspaces: WorkspaceOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentWorkspaceId);

  const current = useMemo(
    () => workspaces.find((item) => item.workspaceId === selected) ?? workspaces[0],
    [selected, workspaces]
  );

  async function switchWorkspace(nextWorkspaceId: string) {
    setSelected(nextWorkspaceId);

    const response = await fetch('/api/workspaces/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: nextWorkspaceId }),
    });

    if (!response.ok) {
      setSelected(currentWorkspaceId);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-xs text-slate-500">Active workspace</div>
        <div className="text-sm font-medium text-slate-900">{current?.workspace.name}</div>
      </div>
      <select
        value={selected}
        onChange={(event) => void switchWorkspace(event.target.value)}
        disabled={isPending}
        className="rounded-2xl border bg-white px-3 py-2 text-sm text-slate-900"
      >
        {workspaces.map((item) => (
          <option key={item.workspaceId} value={item.workspaceId}>
            {item.workspace.name} ({item.role})
          </option>
        ))}
      </select>
    </div>
  );
}
