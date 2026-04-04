import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="AI insights" description="Premium layer turning extracted data into decisions" />
        <div className="stack">
          <div className="soft"><strong>Possible duplicate roadmap item</strong><div className="muted" style={{ marginTop: 6 }}>Three teams describe a similar access approval workflow in different terms.</div></div>
          <div className="soft"><strong>Untapped demand signal</strong><div className="muted" style={{ marginTop: 6 }}>Customer interviews mention export automation 19 times with no matching shipped feature.</div></div>
          <div className="soft"><strong>Coverage gap</strong><div className="muted" style={{ marginTop: 6 }}>SMB onboarding has lower feature density than enterprise onboarding.</div></div>
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Ask the repository" description="Natural-language query entry point" />
        <div className="stack">
          <div className="soft">Example: Show me all payment-related features from last quarter with duplicate probability above 70%.</div>
          <input className="search" placeholder="Ask a natural-language question" />
          <button className="btn primary">Run AI query</button>
        </div>
      </div>
    </div>
  );
}
