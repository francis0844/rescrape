import Link from "next/link";
import { Play, Search } from "lucide-react";

import { runSearch } from "@/app/actions/discovery";
import { ReviewQueue } from "@/components/review-queue";
import { ScanPanel } from "@/components/scan-panel";
import { StatusMessage } from "@/components/status-message";
import {
  getActiveScanJob,
  getAppSettings,
  getDiscoveryInfoForSources,
  getFilteredSources,
  getKeywords,
  getPendingSourceCount,
  getRecentSearchRuns,
  getSearchProviders,
  getSourceStatusCounts,
  getSources,
  type SearchRunRow,
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

type ViewName = "review" | "all" | "approved";

type SourcesPageProps = {
  searchParams: Promise<{
    message?: string;
    runId?: string;
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

function findSummaryRun(runs: SearchRunRow[], runId?: string) {
  return runs.find((run) => run.id === runId) ?? runs[0] ?? null;
}

function parseView(value: string | undefined): ViewName {
  if (value === "all" || value === "approved") {
    return value;
  }

  return "review";
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

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const params = await searchParams;
  const view = parseView(params.view);

  const [settings, keywords, providers, runs, allSources, pendingCount, activeJob, statusCounts] =
    await Promise.all([
      getAppSettings(),
      getKeywords(),
      getSearchProviders(),
      getRecentSearchRuns(50),
      getSources(),
      getPendingSourceCount(),
      getActiveScanJob(),
      getSourceStatusCounts()
    ]);

  const activeKeywords = keywords.filter((keyword) => keyword.active);
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const plannedQueryCount = activeKeywords.length * enabledProviders.length;
  const latestRun = findSummaryRun(runs, params.runId);

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
  } else if (view === "approved") {
    approvedSources = await getFilteredSources({ statuses: ["approved"] });
  }

  const reviewCount = statusCounts.ai_approved + statusCounts.needs_review;
  const totalCount = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Sources</h1>
        <p className="page-kicker">
          Run governed discovery, scan candidate sites, and review AI verdicts — all in one place.
        </p>
      </header>

      <StatusMessage message={params.message} />

      <section className="panel stack-lg" aria-labelledby="run-search-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="run-search-title">
              Run search
            </h2>
            <p className="panel-copy">
              One query per active keyword, through enabled providers only.
            </p>
          </div>
          <Search size={20} aria-hidden="true" />
        </div>

        <div className="metric-grid">
          <div className="metric-tile">
            <span className="metric-label">Active keywords</span>
            <strong>{activeKeywords.length}</strong>
          </div>
          <div className="metric-tile">
            <span className="metric-label">Enabled providers</span>
            <strong>{enabledProviders.length}</strong>
          </div>
          <div className="metric-tile">
            <span className="metric-label">Planned queries</span>
            <strong>{plannedQueryCount}</strong>
          </div>
          <div className="metric-tile">
            <span className="metric-label">Result cap</span>
            <strong>{settings.result_cap_per_query}</strong>
          </div>
        </div>

        <div className="scope-strip">
          <span className="pill">Estimated credits: {plannedQueryCount}</span>
          <span className="pill">
            Domain scope:{" "}
            {settings.include_domains.length
              ? `${settings.include_domains.length} included`
              : "open web"}
          </span>
          <span className="pill">
            Providers:{" "}
            {enabledProviders.length
              ? enabledProviders.map((provider) => provider.name).join(", ")
              : "none enabled"}
          </span>
        </div>

        <form action={runSearch}>
          <button
            className="button fit-content"
            type="submit"
            disabled={!activeKeywords.length || !enabledProviders.length}
          >
            <Play size={16} aria-hidden="true" />
            Run search
          </button>
        </form>
        {!activeKeywords.length || !enabledProviders.length ? (
          <p className="panel-copy">
            Add at least one active keyword and keep one provider enabled before
            running discovery.
          </p>
        ) : null}
      </section>

      {latestRun ? (
        <section className="panel stack-lg" aria-labelledby="latest-run-title">
          <div className="section-heading">
            <div>
              <h2 className="panel-title" id="latest-run-title">
                Latest run summary
              </h2>
              <p className="panel-copy">
                Finished {formatDate(latestRun.finished_at)}
              </p>
            </div>
            <span className="status-pill" data-status={latestRun.status}>
              {latestRun.status}
            </span>
          </div>
          <div className="metric-grid">
            <div className="metric-tile">
              <span className="metric-label">Queries fired</span>
              <strong>{latestRun.query_count}</strong>
            </div>
            <div className="metric-tile">
              <span className="metric-label">New sites</span>
              <strong>{latestRun.result_count}</strong>
            </div>
            <div className="metric-tile">
              <span className="metric-label">Estimated credits</span>
              <strong>{latestRun.credits_spent_est}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <ScanPanel
        pendingCount={pendingCount}
        initialJob={
          activeJob
            ? {
                id: activeJob.id,
                status: activeJob.status,
                totalSites: activeJob.total_sites,
                processedSites: activeJob.processed_sites,
                currentSourceId: activeJob.current_source_id
              }
            : null
        }
      />

      <section className="panel stack-lg" aria-labelledby="source-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="source-list-title">
              Sources
            </h2>
            <p className="panel-copy">
              Review AI verdicts, or browse the full candidate list and trusted sources.
            </p>
          </div>
        </div>

        <nav className="tab-strip" aria-label="Source views">
          <Link className="tab-link" data-active={view === "review"} href="/sources?view=review">
            Needs review
            <span className="tab-count">{reviewCount}</span>
          </Link>
          <Link className="tab-link" data-active={view === "all"} href="/sources?view=all">
            All candidates
            <span className="tab-count">{totalCount}</span>
          </Link>
          <Link className="tab-link" data-active={view === "approved"} href="/sources?view=approved">
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
        ) : null}

        {view === "approved" ? (
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
        ) : null}

        {view === "all" ? (
          allSources.length ? (
            <div className="preview-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Site root</th>
                    <th>Domain</th>
                    <th>Status</th>
                    <th>AI reason</th>
                    <th>Title</th>
                    <th>First discovered</th>
                  </tr>
                </thead>
                <tbody>
                  {allSources.map((source) => (
                    <tr key={source.id}>
                      <td>
                        <a href={source.site_url} target="_blank" rel="noreferrer">
                          {source.site_url}
                        </a>
                      </td>
                      <td>{source.domain}</td>
                      <td>
                        <span className="status-pill" data-status={source.status}>
                          {source.status === "scanning" && source.scan_step
                            ? source.scan_step
                            : source.status}
                        </span>
                      </td>
                      <td>{source.ai_reason ?? "—"}</td>
                      <td>{source.title}</td>
                      <td>{formatDate(source.first_discovered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No candidate sources yet</h3>
              <p>Run search after adding active keywords and enabling a provider.</p>
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}
