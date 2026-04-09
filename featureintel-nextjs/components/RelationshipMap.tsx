export function RelationshipMap() {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Clusters & relationships</h3>
      <div className="muted" style={{ marginBottom: 12 }}>Graph exploration for duplicate work, dependencies, and cross-team overlap</div>
      <div style={{ position: 'relative', height: 420, background: '#f1f5f9', borderRadius: 18 }}>
        <div style={{ position: 'absolute', left: 40, top: 70 }} className="panel">Billing Sync</div>
        <div style={{ position: 'absolute', left: '37%', top: 40 }} className="panel">Approval Workflow</div>
        <div style={{ position: 'absolute', right: 40, top: 90 }} className="panel">Access Control</div>
        <div style={{ position: 'absolute', left: 70, bottom: 70 }} className="panel">Reporting Export</div>
        <div style={{ position: 'absolute', right: 50, bottom: 55 }} className="panel">Audit Traceability</div>
      </div>
    </div>
  );
}
