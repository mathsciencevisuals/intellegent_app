import { getRequestContext } from '@/lib/auth/session';

export default async function SourcesPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="text-sm text-slate-500">
          Show only sources for workspace {ctx.workspaceId}. Use this page to connect Jira, ADO, docs, and uploads.
        </p>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium">Connected sources</div>
          <button className="rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50">Add source</button>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 p-3">Jira Cloud — Connected</div>
          <div className="rounded-2xl bg-slate-50 p-3">Azure DevOps — Connected</div>
          <div className="rounded-2xl bg-slate-50 p-3">PDF Uploads — Active</div>
        </div>
      </div>
    </div>
  );
}
