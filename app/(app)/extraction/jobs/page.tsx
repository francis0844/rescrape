import { Braces, Check, Database, ExternalLink, GripVertical, Play, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { prototypeRecords, prototypeSchema } from "@/lib/prototype-data";

export default function ExtractionJobsPage() {
  const selected = prototypeRecords[0];

  return (
    <div className="page-frame page-frame-wide stack-xl">
      <header className="page-header prototype-page-header">
        <div>
          <p className="page-eyebrow">Phase 02 · Static prototype</p>
          <h1 className="page-title">Extraction workspace</h1>
          <p className="page-kicker">
            Fictional Nebraska obituary sample: extract only from human-approved sources and retain evidence with every record.
          </p>
        </div>
        <button className="button" disabled type="button">
          <Play size={16} aria-hidden="true" />
          Run extraction
        </button>
      </header>

      <section className="job-summary" aria-label="Selected extraction job">
        <div>
          <span className="summary-label">Job</span>
          <strong>Nebraska obituary index</strong>
          <small>JOB-72F3C2</small>
        </div>
        <div>
          <span className="summary-label">Approved sources</span>
          <strong>12 sources</strong>
          <small>Carried from Phase 1</small>
        </div>
        <div>
          <span className="summary-label">Extraction rule</span>
          <strong>9 structured fields</strong>
          <small>Evidence required</small>
        </div>
        <div>
          <span className="summary-label">Schedule</span>
          <strong>Weekly</strong>
          <small>Mondays at 08:00</small>
        </div>
        <div>
          <span className="summary-label">Prototype result</span>
          <strong>1,248 records</strong>
          <small>412 need review</small>
        </div>
      </section>

      <nav className="workspace-tabs" aria-label="Extraction workspace sections">
        <span aria-current="page">Extraction schema</span>
        <Link href="/extraction/records">Records</Link>
        <span aria-disabled="true">Job runs</span>
        <span aria-disabled="true">Settings</span>
      </nav>

      <section className="prototype-section" aria-labelledby="schema-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="schema-title">Extraction schema</h2>
            <p className="panel-copy">The output contract the extraction agent must follow.</p>
          </div>
          <div className="row-actions">
            <button className="button button-secondary" disabled type="button">
              <Braces size={16} aria-hidden="true" /> Validate sample
            </button>
            <button className="button button-secondary" disabled type="button">
              <SlidersHorizontal size={16} aria-hidden="true" /> Edit schema
            </button>
          </div>
        </div>
        <div className="preview-table-wrap">
          <table className="data-table schema-table">
            <thead>
              <tr>
                <th aria-label="Reorder" />
                <th>Field</th>
                <th>Key</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {prototypeSchema.map((field) => (
                <tr key={field.key}>
                  <td><GripVertical size={15} aria-hidden="true" /></td>
                  <td><strong>{field.field}</strong></td>
                  <td><code>{field.key}</code></td>
                  <td>{field.type}</td>
                  <td>{field.required ? <span className="requirement-mark"><Check size={13} /> Required</span> : "Optional"}</td>
                  <td>{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="prototype-section" aria-labelledby="records-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="records-title">Evidence-backed records</h2>
            <p className="panel-copy">Sample output showing how extracted data remains traceable.</p>
          </div>
          <Link className="button button-secondary fit-content" href="/extraction/records">
            View all records <ExternalLink size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="records-inspector-layout">
          <div className="preview-table-wrap">
            <table className="data-table records-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Full name</th>
                  <th>Date of death</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {prototypeRecords.map((record, index) => (
                  <tr className={index === 0 ? "selected-table-row" : undefined} key={record.id}>
                    <td><span className="status-pill" data-status={record.status === "Verified" ? "approved" : "needs_review"}>{record.status}</span></td>
                    <td><strong>{record.title}</strong><small className="table-subtext">{record.id}</small></td>
                    <td>{record.died}</td>
                    <td>{record.location}</td>
                    <td>{record.source}</td>
                    <td>{record.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="record-inspector" aria-labelledby="selected-record-title">
            <div className="inspector-heading">
              <div>
                <span className="summary-label">Selected record</span>
                <h3 id="selected-record-title">{selected.title}</h3>
              </div>
              <Database size={18} aria-hidden="true" />
            </div>
            <dl className="record-details">
              <div><dt>Status</dt><dd><span className="status-pill" data-status="needs_review">Needs review</span></dd></div>
              <div><dt>Date of birth</dt><dd>{selected.born}</dd></div>
              <div><dt>Date of death</dt><dd>{selected.died}</dd></div>
              <div><dt>Published date</dt><dd>{selected.published}</dd></div>
              <div><dt>Location</dt><dd>{selected.location}</dd></div>
              <div><dt>Funeral home</dt><dd>{selected.funeralHome}</dd></div>
              <div><dt>Confidence</dt><dd>{selected.confidence}</dd></div>
            </dl>
            <div className="evidence-block">
              <span className="summary-label">Source evidence</span>
              <p>{selected.evidence}</p>
            </div>
            <div className="provenance-line">
              <Check size={15} aria-hidden="true" /> Source approved by a human in Phase 1
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
