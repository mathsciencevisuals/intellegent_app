import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/app-shell';
import { getCurrentWorkspaceSummary } from '@/lib/auth/current-workspace';
import { getRequestContext } from '@/lib/auth/session';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const [ctx, workspaceSummary] = await Promise.all([
      getRequestContext(),
      getCurrentWorkspaceSummary(),
    ]);

    return (
      <AppShell user={ctx.user} workspaceSummary={workspaceSummary}>
        {children}
      </AppShell>
    );
  } catch {
    redirect('/auth');
  }
}
