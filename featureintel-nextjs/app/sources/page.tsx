import { SectionTitle } from '@/components/SectionTitle';
import { SourceList } from '@/components/SourceList';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div>
        <SectionTitle title="Data sources & ingestion" description="Connection cards, sync controls, project selectors, source health" />
        <SourceList />
      </div>
      <div className="panel">
        <SectionTitle title="Ingestion setup panel" description="Add and configure a source" />
        <div className="stack">
          <input className="search" placeholder="Workspace / tenant name" />
          <input className="search" placeholder="API token / OAuth connected" />
          <div className="top-actions">
            <button className="btn primary">Connect</button>
            <button className="btn">Upload files</button>
          </div>
          <div className="soft">
            <strong>Source preview</strong>
            <div className="stack" style={{ marginTop: 8 }}>
              <div>1,203 Jira stories available for sync</div>
              <div>218 ADO work items pending parse</div>
              <div>34 PDFs with attachments detected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
