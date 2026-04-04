import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Sign in / create account" description="Clean B2B SaaS entry point with SSO-first motion" />
        <div className="stack">
          <button className="btn primary">Continue with SSO</button>
          <button className="btn">Continue with Google</button>
          <div className="muted">or use work email</div>
          <input className="search" placeholder="Work email" />
          <input className="search" placeholder="Password" type="password" />
          <button className="btn">Sign in</button>
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Why this screen matters" description="Enterprise credibility and fast trial activation" />
        <div className="stack">
          <div className="soft">Use SSO-first for enterprise credibility.</div>
          <div className="soft">Keep trial friction low with email-first workspace creation.</div>
          <div className="soft">Show value immediately so users know this is more than a parser.</div>
        </div>
      </div>
    </div>
  );
}
