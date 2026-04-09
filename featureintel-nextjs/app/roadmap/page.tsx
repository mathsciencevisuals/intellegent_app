import { SectionTitle } from '@/components/SectionTitle';

const phases = [
  {
    title: 'Phase 1: MVP',
    items: ['Auth + workspace creation', 'Jira / ADO / PDF ingestion', 'Extraction pipeline with confidence score', 'Feature repository table', 'Basic report export'],
  },
  {
    title: 'Phase 2: Team workflows',
    items: ['Approvals and comments', 'Feature detail page with source traceability', 'Dedup review queue', 'Saved views and scheduled reports', 'Billing and plan enforcement'],
  },
  {
    title: 'Phase 3: Differentiation',
    items: ['AI recommendations', 'Knowledge graph / relationships', 'Natural-language query interface', 'Roadmap suggestions', 'Embedded Jira / ADO app extensions'],
  },
];

export default function Page() {
  return (
    <div>
      <SectionTitle title="MVP to V1 roadmap" description="Concrete next steps to turn the prototype into a real SaaS product" />
      <div className="grid grid-3">
        {phases.map((phase) => (
          <div key={phase.title} className="panel">
            <h3 style={{ marginTop: 0 }}>{phase.title}</h3>
            <div className="stack">
              {phase.items.map((item) => <div key={item} className="soft">{item}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
