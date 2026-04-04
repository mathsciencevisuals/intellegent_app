import Link from 'next/link';
import { features } from '@/data/mock';

export function FeatureTable() {
  return (
    <div className="panel">
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Feature repository</h3>
          <div className="muted">Main operating screen for analysts and product teams</div>
        </div>
        <div className="top-actions">
          <button className="btn">Filters</button>
          <button className="btn">Export</button>
          <button className="btn primary">AI Merge Suggestions</button>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Module</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.id}>
              <td>
                <div><Link href={`/repository/${feature.id}`}><strong>{feature.name}</strong></Link></div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {feature.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}
                </div>
              </td>
              <td>{feature.module}</td>
              <td>{feature.status}</td>
              <td>{feature.confidence}%</td>
              <td className="muted">{feature.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
