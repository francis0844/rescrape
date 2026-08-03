import { Check, Columns3, Download, Filter, Search } from "lucide-react";

import { prototypeRecords } from "@/lib/prototype-data";

export default function ExtractionRecordsPage() {
  const selected = prototypeRecords[1];

  return (
    <div className="page-frame page-frame-wide stack-xl">
      <header className="page-header prototype-page-header">
        <div>
          <p className="page-eyebrow">Phase 02 · Static prototype</p>
          <h1 className="page-title">Extracted records</h1>
          <p className="page-kicker">Review structured output and verify every claim against retained source evidence.</p>
        </div>
        <button className="button button-secondary" disabled type="button"><Download size={16} /> Export selection</button>
      </header>

      <section className="record-toolbar" aria-label="Record filters">
        <label className="prototype-search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search records" disabled placeholder="Search 1,248 records" />
        </label>
        <button className="button button-secondary" disabled type="button"><Filter size={16} /> Status: All</button>
        <button className="button button-secondary" disabled type="button"><Columns3 size={16} /> Columns</button>
        <span className="record-count">Showing 1–5 of 1,248</span>
      </section>

      <div className="records-inspector-layout records-page-layout">
        <section className="preview-table-wrap" aria-label="Extracted record list">
          <table className="data-table records-table">
            <thead><tr><th>Status</th><th>Record title</th><th>Published</th><th>Location</th><th>Category</th><th>Source</th><th>Confidence</th></tr></thead>
            <tbody>
              {prototypeRecords.map((record, index) => (
                <tr className={index === 1 ? "selected-table-row" : undefined} key={record.id}>
                  <td><span className="status-pill" data-status={record.status === "Verified" ? "approved" : "needs_review"}>{record.status}</span></td>
                  <td><strong>{record.title}</strong><small className="table-subtext">{record.id}</small></td>
                  <td>{record.published}</td><td>{record.location}</td><td>{record.category}</td><td>{record.source}</td><td>{record.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="record-inspector record-inspector-tall">
          <div className="inspector-heading"><div><span className="summary-label">Record {selected.id}</span><h2>{selected.title}</h2></div><span className="status-pill" data-status="approved">Verified</span></div>
          <dl className="record-details">
            <div><dt>Published date</dt><dd>{selected.published}</dd></div>
            <div><dt>Location</dt><dd>{selected.location}</dd></div>
            <div><dt>Category</dt><dd>{selected.category}</dd></div>
            <div><dt>Source URL</dt><dd><a href="#source-preview">https://{selected.source}/records/quarterly-release</a></dd></div>
          </dl>
          <div className="evidence-block" id="source-preview"><span className="summary-label">Source evidence</span><p>{selected.evidence}</p></div>
          <div className="evidence-block"><span className="summary-label">Extraction rationale</span><p>The publication date and title are stated directly. Location coverage is explicit in the accompanying directory metadata.</p></div>
          <div className="provenance-stack">
            <p><Check size={15} /> Source was approved in Phase 1</p>
            <p><Check size={15} /> Required fields are present</p>
            <p><Check size={15} /> Evidence retained with record</p>
          </div>
          <div className="inspector-actions"><button className="button" disabled type="button">Accept record</button><button className="button button-secondary" disabled type="button">Flag for review</button></div>
        </aside>
      </div>
    </div>
  );
}
