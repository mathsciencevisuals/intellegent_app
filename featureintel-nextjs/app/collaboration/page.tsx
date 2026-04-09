import { SectionTitle } from '@/components/SectionTitle';

export default function Page() {
  return (
    <div className="grid grid-2">
      <div className="panel">
        <SectionTitle title="Collaboration" description="Comments, assignments, approvals, and change tracking" />
        <div className="stack">
          <div className="soft"><strong>PM Review Requested</strong><div className="muted" style={{ marginTop: 6 }}>Approval workflow feature needs decision by Friday.</div></div>
          <div className="soft"><strong>Engineering Comment</strong><div className="muted" style={{ marginTop: 6 }}>These two ADO stories are implementation variants of one feature.</div></div>
          <div className="soft"><strong>Ops Note</strong><div className="muted" style={{ marginTop: 6 }}>Legacy PDFs have lower extraction confidence. Review manually.</div></div>
        </div>
      </div>
      <div className="panel">
        <SectionTitle title="Approval workflow" description="Operational decisions" />
        <div className="stack">
          <div className="row soft"><span>Approve feature merge</span><span className="badge">pending</span></div>
          <div className="row soft"><span>Reject low-confidence extraction</span><span className="badge">pending</span></div>
          <div className="row soft"><span>Escalate compliance-tagged features</span><span className="badge">done</span></div>
        </div>
      </div>
    </div>
  );
}
