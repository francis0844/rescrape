import Link from "next/link";

import { ReviewQueue } from "@/components/review-queue";
import { StatusMessage } from "@/components/status-message";
import {
  getDiscoveryInfoForSources,
  getFilteredSources,
  getKeywords,
  getRecentSearchRuns,
  getSourceStatusCounts,
  type SourceRow
} from "@/lib/app-data";

export const dynamic = "force-dynamic";

const REVIEW_STATUSES: SourceRow["status"][] = [
  "ai_approved",
  "ai_rejected",
  "needs_review",
  "approved",
  "rejected"
];
const DEFAULT_REVIEW_STATUSES: SourceRow["status"][] = ["ai_approved", "needs_review"];

type ViewName = "review" | "approved";

type ReviewPageProps = {
  searchParams: Promise<{
    message?: string;
    view?: string;
    status?: string;
    keywordId?: string;
    filterRunId?: string;
    minConfidence?: string;
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

function parseStatuses(value: string | undefined): SourceRow["status"][] {
  if (!value) {
    return DEFAULT_REVIEW_STATUSES;
  }

  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is SourceRow["status"] =>
      REVIEW_STATUSES.includes(entry as SourceRow["status"])
    );

  return parsed.length ? parsed : DEFAULT_REVIEW_STATUSES;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  const [keywords, runs, statusCounts] = await Promise.all([
    getKeywords(),
    getRecentSearchRuns(50),
    getSourceStatusCounts()
  ]);

  const reviewStatuses = parseStatuses(params.status);
  const minConfidence = params.minConfidence ? Number(params.minConfidence) : undefined;

  let reviewSources: SourceRow[] = [];
  let discoveryInfo: Awaited<ReturnType<typeof getDiscoveryInfoForSources>> = {};
  let approvedSources: SourceRow[] = [];

  if (view === "review") {
    reviewSources = await getFilteredSources({
      statuses: reviewStatuses,
      keywordId: params.keywordId || undefined,
      runId: params.filterRunId || undefined,
      minConfidence: Number.isFinite(minConfidence) ? minConfidence : undefined
    });
    discoveryInfo = await getDiscoveryInfoForSources(reviewSources.map((source) => source.id));
  } else {
    approvedSources = await getFilteredSources({ statuses: ["approved"] });
  }

  const reviewCount = statusCounts.ai_approved + statusCounts.needs_review;

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Review</h1>
        <p className="page-kicker">
          Step 3 of 3: a human always makes the final approve/reject call.
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
          <>
            <form className="filter-form" method="get">
              <input type="hidden" name="view" value="review" />
              <label className="field">
                <span className="label">Status</span>
                <select className="input" name="status" defaultValue={reviewStatuses.join(",")}>
                  <option value="ai_approved,needs_review">AI approved + needs review</option>
                  <option value="ai_approved">AI approved only</option>
                  <option value="ai_rejected">AI rejected only</option>
                  <option value="needs_review">Needs review only</option>
                  <option value="approved">Human approved</option>
                  <option value="rejected">Human rejected</option>
                  <option value={REVIEW_STATUSES.join(",")}>All reviewed states</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Keyword</span>
                <select className="input" name="keywordId" defaultValue={params.keywordId ?? ""}>
                  <option value="">Any keyword</option>
                  {keywords.map((keyword) => (
                    <option value={keyword.id} key={keyword.id}>
                      {[keyword.topic, keyword.location].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Run</span>
                <select className="input" name="filterRunId" defaultValue={params.filterRunId ?? ""}>
                  <option value="">Any run</option>
                  {runs.map((run) => (
                    <option value={run.id} key={run.id}>
                      {formatDate(run.started_at)} — {run.status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Min. confidence</span>
                <input
                  className="input"
                  type="number"
                  name="minConfidence"
                  min={0}
                  max={1}
                  step={0.05}
                  defaultValue={params.minConfidence ?? ""}
                  placeholder="0.0 – 1.0"
                />
              </label>
              <button className="button button-secondary fit-content" type="submit">
                Apply filters
              </button>
            </form>

            <ReviewQueue sources={reviewSources} discoveryInfo={discoveryInfo} />
          </>
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
