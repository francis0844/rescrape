import Link from "next/link";
import { Download } from "lucide-react";

import { StatusMessage } from "@/components/status-message";
import {
  getFilteredSources,
  getKeywordSearchSummaries,
  getSourceStatusCounts,
  type SourceRow
} from "@/lib/app-data";

export const dynamic = "force-dynamic";

type ViewName = "review" | "approved";

type ReviewPageProps = {
  searchParams: Promise<{
    message?: string;
    view?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not finished";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function parseView(value: string | undefined): ViewName {
  return value === "approved" ? "approved" : "review";
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  const [statusCounts, summaries] = await Promise.all([
    getSourceStatusCounts(),
    getKeywordSearchSummaries()
  ]);

  const reviewCount = statusCounts.ai_approved + statusCounts.needs_review;
  const reviewableSummaries = summaries.filter((summary) => summary.scanState !== "unscanned");

  let approvedSources: SourceRow[] = [];

  if (view === "approved") {
    approvedSources = await getFilteredSources({ statuses: ["approved"] });
  }

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Review</h1>
        <p className="page-kicker">
          Step 3 of 3: a human always makes the final call — User Approved or User Rejected.
        </p>
      </header>

      <StatusMessage message={params.message} />

      <section className="panel stack-lg" aria-labelledby="review-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="review-list-title">
              Sources
            </h2>
            <p className="panel-copy">
              AI verdicts are suggestions — nothing here is trusted until a human approves it.
            </p>
          </div>
          <a className="button button-secondary fit-content" href="/api/export/sources">
            <Download size={16} aria-hidden="true" />
            Export CSV
          </a>
        </div>

        <nav className="tab-strip" aria-label="Review views">
          <Link className="tab-link" data-active={view === "review"} href="/sources/review?view=review">
            Needs review
            <span className="tab-count">{reviewCount}</span>
          </Link>
          <Link className="tab-link" data-active={view === "approved"} href="/sources/review?view=approved">
            Approved (trusted)
            <span className="tab-count">{statusCounts.approved}</span>
          </Link>
        </nav>

        {view === "review" ? (
          reviewableSummaries.length ? (
            <div className="preview-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Needs review</th>
                    <th>AI approved</th>
                    <th>AI rejected</th>
                    <th>User approved</th>
                    <th>User rejected</th>
                    <th>Last searched</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {reviewableSummaries.map((summary) => (
                    <tr key={summary.keywordId}>
                      <td>{[summary.topic, summary.location].filter(Boolean).join(" · ")}</td>
                      <td>{summary.statusCounts.needs_review ?? 0}</td>
                      <td>{summary.statusCounts.ai_approved ?? 0}</td>
                      <td>{summary.statusCounts.ai_rejected ?? 0}</td>
                      <td>{summary.statusCounts.approved ?? 0}</td>
                      <td>{summary.statusCounts.rejected ?? 0}</td>
                      <td>{formatDate(summary.lastDiscoveredAt)}</td>
                      <td>
                        <Link
                          className="button button-secondary"
                          href={`/sources/review/${summary.keywordId}`}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nothing to review yet</h3>
              <p>Scan a keyword&apos;s sites first — verdicts land here once scanning finishes.</p>
            </div>
          )
        ) : (
          <>
            <p className="panel-copy">
              Every source with status <code>approved</code> — the handoff feeding the future
              Parsing phase.
            </p>
            {approvedSources.length ? (
              <div className="preview-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Site root</th>
                      <th>Domain</th>
                      <th>Extractable fields</th>
                      <th>Last scanned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedSources.map((source) => (
                      <tr key={source.id}>
                        <td>
                          <a href={source.site_url} target="_blank" rel="noreferrer">
                            {source.site_url}
                          </a>
                        </td>
                        <td>{source.domain}</td>
                        <td>
                          {source.extractable_fields?.length ? (
                            <div className="chip-row">
                              {source.extractable_fields.map((field) => (
                                <span className="chip" key={field}>
                                  {field}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{formatDate(source.last_scanned_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No approved sources yet</h3>
                <p>Approve sources from the Needs review tab to build the trusted list.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
