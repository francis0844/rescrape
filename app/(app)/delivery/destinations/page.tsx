import { Check, FileDown, FileSpreadsheet, Mail, MessageCircle, Send, Webhook } from "lucide-react";

import { prototypeDestinations, prototypeRecords } from "@/lib/prototype-data";

const destinationIcons = [FileDown, Mail, MessageCircle, Webhook, FileSpreadsheet];

export default function DestinationsPage() {
  return (
    <div className="page-frame page-frame-wide stack-xl">
      <header className="page-header prototype-page-header">
        <div>
          <p className="page-eyebrow">Phase 03 · Static prototype</p>
          <h1 className="page-title">Delivery destinations</h1>
          <p className="page-kicker">Map reviewed records to a destination, preview the payload, then require final human approval.</p>
        </div>
        <button className="button" disabled type="button"><Send size={16} /> Activate delivery</button>
      </header>

      <section className="delivery-layout" aria-label="Destination configuration">
        <nav className="destination-list" aria-label="Available destinations">
          <div className="destination-list-heading"><span className="summary-label">Destination type</span><strong>Choose an output</strong></div>
          {prototypeDestinations.map((destination, index) => {
            const Icon = destinationIcons[index];
            const selected = index === 1;
            return (
              <div className="destination-option" data-selected={selected} key={destination.name}>
                <Icon size={18} aria-hidden="true" />
                <span><strong>{destination.name}</strong><small>{destination.detail}</small></span>
                <span className="destination-state">{destination.status}</span>
              </div>
            );
          })}
          <div className="destination-evidence"><Check size={16} /><span><strong>Evidence retained</strong><small>Source pages and extracted passages remain attached to delivered records.</small></span></div>
        </nav>

        <div className="delivery-config stack-lg">
          <div className="delivery-config-header">
            <div><span className="summary-label">Selected destination</span><h2>Email digest</h2></div>
            <span className="status-pill" data-status="needs_review">Preview</span>
          </div>

          <section className="config-section" aria-labelledby="mapping-title">
            <div className="section-heading"><div><h3 className="panel-title" id="mapping-title">Field mapping</h3><p className="panel-copy">Choose how extracted fields appear in the outgoing file.</p></div></div>
            <div className="mapping-table" role="table" aria-label="Field mapping preview">
              <div className="mapping-row mapping-header" role="row"><span>Extracted field</span><span aria-hidden="true" /><span>Outgoing column</span><span>Include</span></div>
              {[
                ["title", "Record title"], ["published_date", "Published date"], ["location", "Location"], ["summary", "Summary"], ["source_url", "Source URL"], ["source_evidence", "Evidence"]
              ].map(([source, output]) => (
                <div className="mapping-row" role="row" key={source}>
                  <code>{source}</code><span aria-hidden="true">→</span><span className="static-select">{output}</span><span className="mapping-check"><Check size={14} /></span>
                </div>
              ))}
            </div>
          </section>

          <div className="delivery-settings-grid">
            <section className="config-section"><h3 className="panel-title">Recipients</h3><div className="recipient-list"><span>research@company.com</span><span>operations@company.com</span></div><button className="text-button" disabled type="button">Add recipient</button></section>
            <section className="config-section"><h3 className="panel-title">Schedule</h3><label className="static-radio"><input defaultChecked disabled type="radio" /> Daily at 08:00</label><label className="static-radio"><input disabled type="radio" /> Weekly</label><label className="static-radio"><input disabled type="radio" /> Manual only</label></section>
            <section className="config-section"><h3 className="panel-title">File format</h3><dl className="compact-definition"><div><dt>Format</dt><dd>CSV</dd></div><div><dt>Encoding</dt><dd>UTF-8</dd></div><div><dt>New records only</dt><dd>Yes</dd></div></dl></section>
          </div>
        </div>
      </section>

      <section className="prototype-section" aria-labelledby="delivery-preview-title">
        <div className="section-heading"><div><h2 className="panel-title" id="delivery-preview-title">Delivery preview</h2><p className="panel-copy">First 5 of 1,248 records. No data will be sent from this prototype.</p></div><button className="button button-secondary" disabled type="button"><Mail size={16} /> Send test email</button></div>
        <div className="preview-table-wrap"><table className="data-table"><thead><tr><th>Record title</th><th>Published date</th><th>Location</th><th>Summary</th><th>Source URL</th><th>Evidence</th></tr></thead><tbody>{prototypeRecords.map((record) => <tr key={record.id}><td>{record.title}</td><td>{record.published}</td><td>{record.location}</td><td>{record.evidence.slice(0, 72)}…</td><td>{record.source}</td><td>Retained</td></tr>)}</tbody></table></div>
        <div className="approval-strip"><div><span className="summary-label">Final control</span><strong>Human approval required before delivery</strong><p>The production version will show the destination, record count, and schedule one final time.</p></div><button className="button" disabled type="button">Request approval</button></div>
      </section>
    </div>
  );
}
