import Link from 'next/link';
import { WorkspaceSwitcher } from './workspace-switcher';
import { signOutAction } from '@/lib/auth/server-actions';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sources', label: 'Sources' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/repository', label: 'Repository' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({
  children,
  user,
  workspaceSummary,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  workspaceSummary: {
    currentWorkspaceId: string;
    currentRole: string;
    workspaces: {
      workspaceId: string;
      role: string;
      workspace: { id: string; name: string; slug: string };
    }[];
  };
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r bg-white p-4">
          <Link href="/dashboard" className="mb-6 block rounded-2xl px-3 py-2">
            <div className="text-lg font-semibold">FeatureIntel</div>
            <div className="text-xs text-slate-500">Feature Intelligence Platform</div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>
          <header className="border-b bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <WorkspaceSwitcher
                currentWorkspaceId={workspaceSummary.currentWorkspaceId}
                workspaces={workspaceSummary.workspaces}
              />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name ?? 'User'}</div>
                  <div className="text-xs text-slate-500">{user.email ?? ''}</div>
                </div>
                <form action={signOutAction}>
                  <button className="rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
