import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Onboarding wizard" description="Guide first-time users to their first aha moment fast" />
        <div className="grid grid-4">
          {['Workspace', 'Sources', 'Goals', 'First Scan'].map((step, i) => (
            <div key={step} className="soft" style={i === 1 ? { background: '#0f172a', color: 'white' } : {}}>{step}</div>
          ))}
        </div>
        <div className="stack" style={{ marginTop: 16 }}>
          {[
            ['Jira', 'Sync epics, stories, acceptance criteria'],
            ['Azure DevOps', 'Read features, PBIs, backlog items'],
            ['Confluence / Notion', 'Extract specs and design notes'],
            ['PDF / Docs', 'Import legacy product material'],
          ].map(([title, body]) => (
            <div key={title} className="soft">
              <strong>{title}</strong>
              <div className="muted" style={{ marginTop: 6 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Onboarding goals" description="What this flow should achieve" />
        <div className="stack">
          <div className="soft">Connect at least one high-signal source in under 3 minutes.</div>
          <div className="soft">Capture the main use case: duplication, repository, or reporting.</div>
          <div className="soft">Trigger a small first scan so value is visible immediately.</div>
        </div>
      </div>
    </div>
  );
}
