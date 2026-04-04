const stages = [
  { label: 'Ingested', value: 100 },
  { label: 'Parsed', value: 86 },
  { label: 'Extracted', value: 72 },
  { label: 'Deduplicated', value: 58 },
  { label: 'Approved', value: 41 },
];

export function ProgressList() {
  return (
    <div className="stack">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="row" style={{ marginBottom: 8 }}>
            <span>{stage.label}</span>
            <span className="muted">{stage.value}%</span>
          </div>
          <div className="progress"><span style={{ width: `${stage.value}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
