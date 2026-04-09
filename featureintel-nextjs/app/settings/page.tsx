import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Tenant settings" description="Enterprise controls for a monetizable SaaS product" />
        <div className="stack">
          {['SSO / SAML', 'API keys and service accounts', 'Workspace-level retention policies', 'Usage limits and AI credits'].map((item) => (
            <div key={item} className="row soft">
              <span>{item}</span>
              <button className="btn">Configure</button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Recommended backend modules" description="Suggested services behind the UI" />
        <div className="stack">
          <div className="soft">Auth service: SSO, tenant isolation, user roles</div>
          <div className="soft">Connector service: Jira, ADO, docs, file ingestion</div>
          <div className="soft">Pipeline service: parsing, extraction, clustering, retries</div>
          <div className="soft">Repository API: features, approvals, source traceability</div>
          <div className="soft">Insights service: reporting, recommendations, natural-language queries</div>
        </div>
      </div>
    </div>
  );
}
