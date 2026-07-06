import Link from "next/link";

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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-kicker">
          Where every candidate site currently stands, and what discovery has run recently.
        </p>
      </header>

      <section className="panel stack-lg" aria-labelledby="counts-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="counts-title">
              Source status
            </h2>
            <p className="panel-copy">{total} site roots tracked in total.</p>
          </div>
          <Link className="button button-secondary fit-content" href="/sources?view=review">
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
          <Link className="button button-secondary fit-content" href="/sources">
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
            <p>Add keywords, enable a provider, then run search from the Sources page.</p>
          </div>
        )}
      </section>
    </div>
  );
}
