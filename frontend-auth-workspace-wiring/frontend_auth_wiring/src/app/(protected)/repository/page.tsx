import { getRequestContext } from '@/lib/auth/session';

export default async function RepositoryPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feature Repository</h1>
        <p className="text-sm text-slate-500">
          Repository queries should be filtered by workspace {ctx.workspaceId} and role {ctx.role}.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <div>Feature</div>
          <div>Status</div>
          <div>Confidence</div>
          <div>Source</div>
        </div>
        {[
          ['Role-based approval workflow', 'In Review', '94%', 'Jira + PRD PDF'],
          ['Bulk feature merge suggestions', 'Planned', '88%', 'ADO Stories'],
        ].map(([name, status, confidence, source]) => (
          <div key={name} className="grid grid-cols-[2fr_1fr_1fr_1fr] border-t px-4 py-4 text-sm">
            <div className="font-medium">{name}</div>
            <div>{status}</div>
            <div>{confidence}</div>
            <div className="text-slate-500">{source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
