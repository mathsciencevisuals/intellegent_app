import { SectionTitle } from '@/components/SectionTitle';

const items = [
  ['Q2 Enterprise Features', '42 features • shared with product leadership'],
  ['Payments Duplicate Review', '17 merge candidates • awaiting action'],
  ['Mobile Experience Gaps', 'Coverage comparison across app journeys'],
  ['Roadmap Draft Candidates', 'Unshipped but validated features'],
  ['Compliance Traceability', 'Audit-friendly source-linked items'],
  ['Weekly PM Report', 'Auto-refreshed every Monday 8 AM'],
];

export default function Page() {
  return (
    <div>
      <SectionTitle title="Saved views / knowledge base" description="Bookmark filtered contexts for recurring analysis workflows" />
      <div className="grid grid-3">
        {items.map(([title, body]) => (
          <div key={title} className="panel">
            <strong>{title}</strong>
            <div className="muted" style={{ marginTop: 8 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
