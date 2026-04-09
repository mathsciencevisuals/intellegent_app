import Link from "next/link";
import { getServerSession } from "next-auth";
import { Plus, Search } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  activeSlug?: string;
};

export async function WorkspaceBrowserPane({ activeSlug }: Props) {
  const session = await getServerSession(authConfig);

  const user =
    session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            memberships: {
              include: { workspace: true },
            },
          },
        })
      : null;

  const workspaces = user?.memberships ?? [];

  return (
    <aside className="bg-neutral-100 border-r min-h-screen">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Workspaces</h2>
          <Link
            href="/workspaces/new"
            className="p-2 border rounded hover:bg-neutral-100"
          >
            <Plus size={16} />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded">
          <Search size={14} className="text-neutral-400" />
          <span className="text-sm text-neutral-400">
            Search workspaces
          </span>
        </div>
      </div>

      {/* List */}
      <div className="p-3 space-y-2">
        {workspaces.map((m) => {
          const ws = m.workspace;
          const active = ws.slug === activeSlug;

          return (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.slug}`}
              className={`block rounded-lg p-3 border ${
                active
                  ? "bg-black text-white"
                  : "bg-white hover:bg-neutral-50"
              }`}
            >
              <div className="font-medium">{ws.name}</div>
              <div className="text-xs opacity-70">
                Role: {m.role}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
