import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Billing and plans" description="SaaS monetization screen for upgrades, usage, and seats" />
        <div className="grid grid-3">
          {[
            ['Starter', '5 seats • 2 sources • basic extraction'],
            ['Growth', '20 seats • workflows • scheduled reports'],
            ['Enterprise', 'Unlimited seats • SSO • audit • AI insights'],
          ].map(([title, body], i) => (
            <div key={title} className="soft" style={i === 1 ? { background: '#0f172a', color: 'white' } : {}}>
              <strong>{title}</strong>
              <div style={{ marginTop: 8 }}>{body}</div>
              <button className="btn" style={{ marginTop: 12 }}>Choose plan</button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Usage summary" description="Current workspace consumption" />
        <div className="stack">
          {[
            ['AI extraction runs', '7,430 / month'],
            ['Connected projects', '24'],
            ['Workspace seats', '13 active'],
            ['Storage', '62 GB'],
          ].map(([label, value]) => (
            <div key={label} className="row soft">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
