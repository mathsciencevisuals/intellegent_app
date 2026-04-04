import { notFound } from 'next/navigation';
import { features } from '@/data/mock';
import { SectionTitle } from '@/components/SectionTitle';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feature = features.find((item) => item.id === id);

  if (!feature) notFound();

  return (
    <div className="grid grid-2">
      <div className="stack">
        <div className="panel">
          <SectionTitle title={feature.name} description={`${feature.module} • ${feature.source}`} />
          <div className="muted">{feature.summary}</div>
          <div className="grid grid-3" style={{ marginTop: 16 }}>
            <div className="soft">Confidence: {feature.confidence}%</div>
            <div className="soft">Duplicate probability: 76%</div>
            <div className="soft">Owner: Product Ops</div>
          </div>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Traceability</h3>
          <div className="stack">
            <div className="soft">Source story: ADO-1842 — Support multi-step approval</div>
            <div className="soft">Source PDF: Enterprise governance PRD, page 12</div>
            <div className="soft">Linked cluster: Access approval and audit workflow</div>
          </div>
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Reviewer actions" description="Inspect, approve, edit, and govern one extracted feature" />
        <div className="stack">
          {['Approve feature', 'Request merge review', 'Edit generated summary', 'Assign owner', 'Add compliance tag'].map((item) => (
            <div key={item} className="row soft">
              <span>{item}</span>
              <button className="btn">Open</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
