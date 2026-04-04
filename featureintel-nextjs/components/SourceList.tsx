import { sources } from '@/data/mock';

export function SourceList() {
  return (
    <div className="stack">
      {sources.map((source) => (
        <div key={source.name} className="panel">
          <div className="row">
            <div>
              <div><strong>{source.name}</strong></div>
              <div className="muted">{source.projects} repositories / projects</div>
            </div>
            <span className="badge">{source.status}</span>
            <div className="muted">{source.sync}</div>
            <button className="btn">Manage</button>
          </div>
        </div>
      ))}
    </div>
  );
}
