import { stats } from '@/data/mock';

export function KpiGrid() {
  return (
    <div className="grid grid-4">
      {stats.map((item) => (
        <div key={item.label} className="kpi">
          <div className="muted">{item.label}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{item.value}</div>
            <span className="badge">{item.delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
