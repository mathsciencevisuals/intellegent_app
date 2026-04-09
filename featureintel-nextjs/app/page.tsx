import { SectionTitle } from '@/components/SectionTitle';
import { CodeBlock } from '@/components/CodeBlock';

const tree = `app/
  auth/page.tsx
  onboarding/page.tsx
  dashboard/page.tsx
  sources/page.tsx
  pipeline/page.tsx
  repository/page.tsx
  repository/[id]/page.tsx
  relationships/page.tsx
  reports/page.tsx
  insights/page.tsx
  saved/page.tsx
  collaboration/page.tsx
  billing/page.tsx
  settings/page.tsx
  roadmap/page.tsx
components/
  AppShell.tsx
  FeatureTable.tsx
  KpiGrid.tsx
  ProgressList.tsx
  RelationshipMap.tsx
  SectionTitle.tsx
data/mock.ts
lib/utils.ts`;

export default function Page() {
  return (
    <div className="stack">
      <SectionTitle
        title="Suggested SaaS architecture"
        description="Multi-tenant platform focused on ingestion, AI extraction, governance, and product decision workflows"
      />

      <div className="grid grid-2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Data flow</h3>
          <div className="grid grid-4">
            {[
              ['Connect', 'Source adapters and auth'],
              ['Parse', 'Text and metadata extraction'],
              ['Extract', 'Feature, acceptance criteria, entities'],
              ['Govern', 'Review, audit, and publish'],
            ].map(([title, body]) => (
              <div key={title} className="soft">
                <strong>{title}</strong>
                <div className="muted" style={{ marginTop: 6 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Core capabilities</h3>
          <div className="stack">
            <div className="soft">Workspace isolation, SSO, role-based access</div>
            <div className="soft">Source links, confidence scores, approvals</div>
            <div className="soft">Queue-based processing and retries</div>
            <div className="soft">Usage-based plans and AI credit metering</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Generated Next.js app structure</h3>
        <CodeBlock code={tree} />
      </div>
    </div>
  );
}
