import { reports } from '@/data/mock';
import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Reports & exports" description="Leadership and operations reporting center" />
        <div className="stack">
          {reports.map((report) => (
            <div key={report} className="row soft">
              <span>{report}</span>
              <div className="top-actions">
                <button className="btn">Preview</button>
                <button className="btn primary">Generate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Analytics panel" description="Feature distribution by module" />
        <div className="stack">
          {[
            ['Core Platform', 82],
            ['Admin', 64],
            ['Reporting', 51],
            ['Integrations', 39],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="progress"><span style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
