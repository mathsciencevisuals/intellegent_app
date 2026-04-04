import { getRequestContext } from '@/lib/auth/session';

export default async function DashboardPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Signed in as {ctx.user.email} in workspace {ctx.workspaceId}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Features Extracted', '12,480'],
          ['Duplicate Candidates', '384'],
          ['Connected Sources', '24'],
          ['Open Reviews', '42'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
