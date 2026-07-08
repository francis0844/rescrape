import Link from "next/link";
import { Play, Search } from "lucide-react";

import { runSearch } from "@/app/actions/discovery";
import { KeywordPicker } from "@/components/keyword-picker";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import {
  getAppSettings,
  getKeywordSearchSummaries,
  getKeywords,
  getRecentSearchRuns,
  getSearchProviders,
  type SearchRunRow
} from "@/lib/app-data";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    message?: string;
    runId?: string;
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const [settings, keywords, providers, runs, keywordSummaries] = await Promise.all([
    getAppSettings(),
    getKeywords(),
    getSearchProviders(),
    getRecentSearchRuns(50),
    getKeywordSearchSummaries()
  ]);

  const activeKeywords = keywords.filter((keyword) => keyword.active);
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const plannedQueryCount = activeKeywords.length * enabledProviders.length;
  const latestRun = findSummaryRun(runs, params.runId);
  const keywordOptions = activeKeywords.map((keyword) => ({
    id: keyword.id,
    label: [keyword.topic, keyword.location].filter(Boolean).join(" · ")
  }));

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-kicker">
          Step 1 of 3: fire capped discovery queries and collect candidate site roots.
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
              One query per selected keyword, through enabled providers only.
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

        {activeKeywords.length ? (
          <form action={runSearch} className="stack-md">
            <KeywordPicker options={keywordOptions} />
            <SubmitButton
              className="button fit-content"
              disabled={!enabledProviders.length}
              pendingLabel="Searching..."
            >
              <Play size={16} aria-hidden="true" />
              Run search
            </SubmitButton>
          </form>
        ) : null}
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

      <section className="panel stack-lg" aria-labelledby="source-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="source-list-title">
              Searched keywords
            </h2>
            <p className="panel-copy">
              {keywordSummaries.length} keyword{keywordSummaries.length === 1 ? "" : "s"} have
              discovered sites so far. Open one to see its site roots.
            </p>
          </div>
        </div>

        {keywordSummaries.length ? (
          <div className="preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Sites found</th>
                  <th>Scan status</th>
                  <th>Last searched</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keywordSummaries.map((summary) => (
                  <tr key={summary.keywordId}>
                    <td>{[summary.topic, summary.location].filter(Boolean).join(" · ")}</td>
                    <td>{summary.totalSources}</td>
                    <td>
                      <span className="status-pill" data-status={summary.scanState}>
                        {summary.scanState.replace("_", " ")}
                      </span>
                    </td>
                    <td>{formatDate(summary.lastDiscoveredAt)}</td>
                    <td>
                      <Link
                        className="button button-secondary"
                        href={`/sources/search/${summary.keywordId}`}
                      >
                        View sites
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No searched keywords yet</h3>
            <p>Run search after adding active keywords and enabling a provider.</p>
          </div>
        )}
      </section>
    </div>
  );
}
