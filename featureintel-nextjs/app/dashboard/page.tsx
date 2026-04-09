import { KpiGrid } from '@/components/KpiGrid';

export default function Page() {
  return (
    <div className="stack">
      <KpiGrid />
      <div className="grid grid-main">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Feature growth trend</h3>
          <div className="chart">
            {[35, 52, 44, 63, 71, 68, 82, 90, 86, 96].map((value, idx) => (
              <div key={idx} className="bar" style={{ height: `${value}%` }} />
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Duplicate hotspots</h3>
            <div className="stack">
              <div className="soft">Payments: 41 duplicate candidates</div>
              <div className="soft">Admin: 23 overlapping flows</div>
              <div className="soft">Reports: 17 near-matches</div>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Activity feed</h3>
            <div className="stack">
              <div>PDF batch #328 extracted 94 features</div>
              <div>7 feature merges approved by product ops</div>
              <div>New monthly report generated for leadership</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
