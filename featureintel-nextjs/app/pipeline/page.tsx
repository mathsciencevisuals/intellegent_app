import { SectionTitle } from '@/components/SectionTitle';
import { ProgressList } from '@/components/ProgressList';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Processing pipeline" description="Queue health, stage progression, manual retry, exception handling" />
        <ProgressList />
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {[
            ['Low confidence batch', '17 docs'],
            ['Manual reviews waiting', '42 items'],
            ['Completed today', '1,842 items'],
          ].map(([title, value]) => (
            <div key={title} className="soft">
              <strong>{title}</strong>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Pipeline controls" description="Operational actions" />
        <div className="stack">
          {[
            'Retry failed parsing jobs',
            'Escalate low-confidence extraction for approval',
            'Re-run deduplication with stricter threshold',
            'Switch classifier from module-first to persona-first',
          ].map((item) => (
            <div key={item} className="row soft">
              <span>{item}</span>
              <button className="btn">Run</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
