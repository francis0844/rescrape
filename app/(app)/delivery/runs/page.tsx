import { Check, Clock3, Eye, RotateCcw } from "lucide-react";

import { prototypeDeliveries } from "@/lib/prototype-data";

export default function DeliveryRunsPage() {
  return (
    <div className="page-frame page-frame-wide stack-xl">
      <header className="page-header prototype-page-header">
        <div>
          <p className="page-eyebrow">Phase 03 · Static prototype</p>
          <h1 className="page-title">Delivery history</h1>
          <p className="page-kicker">A durable audit trail of what was prepared, where it was destined, and who approved it.</p>
        </div>
        <button className="button button-secondary" disabled type="button"><RotateCcw size={16} /> Retry failed</button>
      </header>

      <section className="journey-ledger" aria-labelledby="journey-title">
        <div className="section-heading"><div><h2 className="panel-title" id="journey-title">One record, end to end</h2><p className="panel-copy">The same provenance remains visible from source discovery through delivery.</p></div><span className="record-count">Audit ID AUD-8821</span></div>
        <ol className="journey-steps">
          <li data-state="complete"><span className="journey-number"><Check size={16} /></span><div><span className="summary-label">01 Sources · Live</span><strong>12 sources approved</strong><small>Approved by operator · May 17 at 14:22</small></div></li>
          <li data-state="preview"><span className="journey-number">02</span><div><span className="summary-label">02 Extraction · Preview</span><strong>1,248 records structured</strong><small>Evidence retained · 412 need review</small></div></li>
          <li data-state="preview"><span className="journey-number">03</span><div><span className="summary-label">03 Delivery · Preview</span><strong>Email digest prepared</strong><small>Awaiting final human approval</small></div></li>
        </ol>
      </section>

      <section className="prototype-section" aria-labelledby="history-title">
        <div className="section-heading"><div><h2 className="panel-title" id="history-title">Prepared deliveries</h2><p className="panel-copy">Representative history for the proposed delivery system.</p></div></div>
        <div className="preview-table-wrap">
          <table className="data-table delivery-table">
            <thead><tr><th>Delivery</th><th>Destination</th><th>Records</th><th>State</th><th>Prepared</th><th>Approval</th><th /></tr></thead>
            <tbody>{prototypeDeliveries.map((delivery, index) => <tr key={delivery.id}><td><strong>{delivery.id}</strong></td><td>{delivery.destination}</td><td>{delivery.records}</td><td><span className="status-pill" data-status={index === 0 ? "approved" : "needs_review"}>{delivery.state}</span></td><td>{delivery.time}</td><td>{index === 0 ? "Alex Operator" : "Required"}</td><td><button className="icon-control" disabled aria-label={`View ${delivery.id}`} type="button"><Eye size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="audit-detail-layout">
        <div className="prototype-section"><h2 className="panel-title">Selected delivery · DEL-0042</h2><dl className="audit-definition"><div><dt>Destination</dt><dd>CSV archive</dd></div><div><dt>Record scope</dt><dd>Verified and accepted records</dd></div><div><dt>Prepared by</dt><dd>Alex Operator</dd></div><div><dt>Evidence policy</dt><dd>Source URL and passage included</dd></div><div><dt>Format</dt><dd>CSV · UTF-8 · Header row</dd></div></dl></div>
        <div className="prototype-section"><h2 className="panel-title">Audit events</h2><ol className="event-list"><li><Clock3 size={15} /><span><strong>Delivery approved</strong><small>May 19, 2026 · 09:15</small></span></li><li><Check size={15} /><span><strong>Record review completed</strong><small>May 19, 2026 · 09:08</small></span></li><li><Check size={15} /><span><strong>Evidence bundle attached</strong><small>May 19, 2026 · 09:06</small></span></li><li><Check size={15} /><span><strong>Destination validated</strong><small>May 19, 2026 · 09:02</small></span></li></ol></div>
      </section>
    </div>
  );
}
