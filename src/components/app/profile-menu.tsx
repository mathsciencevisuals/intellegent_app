"use client";

import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

type Props = {
  name?: string | null;
  email: string;
  role: string;
  workspaceCount: number;
  pendingInviteCount: number;
};

function getInitials(name?: string | null, email?: string) {
  const source = name?.trim() || email || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function ProfileMenu({
  name,
  email,
  role,
  workspaceCount,
  pendingInviteCount,
}: Props) {
  const [open, setOpen] = useState(false);

  const now = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const initials = getInitials(name, email);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white"
        aria-label="Open profile menu"
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-neutral-900">
                {name || "Unnamed user"}
              </div>
              <div className="truncate text-sm text-neutral-500">{email}</div>
              <div className="mt-2 inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                {role}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-neutral-50 p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                Workspaces
              </div>
              <div className="mt-2 text-lg font-semibold text-neutral-900">
                {workspaceCount}
              </div>
            </div>
            <div className="rounded-xl border bg-neutral-50 p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                Pending invites
              </div>
              <div className="mt-2 text-lg font-semibold text-neutral-900">
                {pendingInviteCount}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <div className="text-neutral-500">Current time</div>
            <div className="rounded-xl bg-neutral-50 p-3 text-neutral-700">
              {now}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div className="text-sm text-neutral-700">
              Your session is active and scoped to the current workspace platform.
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
