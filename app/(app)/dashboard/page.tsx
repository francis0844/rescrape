import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { getRecentSearchRuns, getSourceStatusCounts } from "@/lib/app-data";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Not finished";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  scanning: "Scanning",
  ai_approved: "AI approved",
  ai_rejected: "AI rejected",
  needs_review: "Needs review",
  approved: "Approved",
  rejected: "Rejected"
};

export default async function DashboardPage() {
  const [counts, runs] = await Promise.all([
    getSourceStatusCounts(),
    getRecentSearchRuns(8)
  ]);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <p className="page-eyebrow page-eyebrow-live">Pipeline overview</p>
        <h1 className="page-title">From public sources to governed data</h1>
        <p className="page-kicker">
          Control where research starts, preserve evidence during extraction, then approve where records are delivered.
        </p>
      </header>

      <section className="pipeline-overview" aria-label="Three-phase product journey">
        <div className="overview-phase" data-state="live">
          <div className="overview-phase-heading">
            <span className="overview-phase-number">01</span>
            <span className="phase-status" data-status="live">Live</span>
          </div>
          <div>
            <h2>Find trustworthy sources</h2>
            <p>Search within explicit boundaries, scan candidates, and let a human approve the source list.</p>
          </div>
          <ul>
            <li><Check size={14} /> Governed search providers</li>
            <li><Check size={14} /> Bounded verification</li>
            <li><Check size={14} /> Human source approval</li>
          </ul>
          <Link href="/sources/search">Open source searching <ArrowRight size={15} /></Link>
        </div>
        <div className="overview-phase" data-state="preview">
          <div className="overview-phase-heading">
            <span className="overview-phase-number">02</span>
            <span className="phase-status" data-status="preview">Preview</span>
          </div>
          <div>
            <h2>Extract structured records</h2>
            <p>Define the fields you need, extract only from approved sources, and retain supporting evidence.</p>
          </div>
          <ul>
            <li><Check size={14} /> Reusable extraction schema</li>
            <li><Check size={14} /> Evidence per record</li>
            <li><Check size={14} /> Review uncertain output</li>
          </ul>
          <Link href="/extraction/jobs">View extraction prototype <ArrowRight size={15} /></Link>
        </div>
        <div className="overview-phase" data-state="preview">
          <div className="overview-phase-heading">
            <span className="overview-phase-number">03</span>
            <span className="phase-status" data-status="preview">Preview</span>
          </div>
          <div>
            <h2>Deliver approved data</h2>
            <p>Map reviewed records to CSV, email, messaging, webhooks, sheets, or future destinations.</p>
          </div>
          <ul>
            <li><Check size={14} /> Destination field mapping</li>
            <li><Check size={14} /> Scheduled or manual delivery</li>
            <li><Check size={14} /> Final human approval</li>
          </ul>
          <Link href="/delivery/destinations">View delivery prototype <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="panel stack-lg" aria-labelledby="counts-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="counts-title">
              Source status
            </h2>
            <p className="panel-copy">{total} site roots tracked in total.</p>
          </div>
          <Link className="button button-secondary fit-content" href="/sources/review">
            Go to review
          </Link>
        </div>

        <div className="metric-grid">
          {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((status) => (
            <div className="metric-tile" key={status}>
              <span className="metric-label">{STATUS_LABELS[status]}</span>
              <strong>{counts[status as keyof typeof counts] ?? 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack-lg" aria-labelledby="recent-runs-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="recent-runs-title">
              Recent search runs
            </h2>
            <p className="panel-copy">Latest discovery activity, most recent first.</p>
          </div>
          <Link className="button button-secondary fit-content" href="/sources/search">
            Run search
          </Link>
        </div>

        {runs.length ? (
          <div className="preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Status</th>
                  <th>Queries</th>
                  <th>New sites</th>
                  <th>Est. credits</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{formatDate(run.started_at)}</td>
                    <td>
                      <span className="status-pill" data-status={run.status}>
                        {run.status}
                      </span>
                    </td>
                    <td>{run.query_count}</td>
                    <td>{run.result_count}</td>
                    <td>{run.credits_spent_est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No search runs yet</h3>
            <p>Add keywords, enable a provider, then run search from the Search page.</p>
          </div>
        )}
      </section>
    </div>
  );
}
