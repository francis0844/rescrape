import { Play, Search } from "lucide-react";

import { runSearch } from "@/app/actions/discovery";
import { StatusMessage } from "@/components/status-message";
import {
  getAppSettings,
  getKeywords,
  getRecentSearchRuns,
  getSearchProviders,
  getSources,
  type SearchRunRow
} from "@/lib/app-data";

export const dynamic = "force-dynamic";

type SourcesPageProps = {
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

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const [{ message, runId }, settings, keywords, providers, runs, sources] =
    await Promise.all([
      searchParams,
      getAppSettings(),
      getKeywords(),
      getSearchProviders(),
      getRecentSearchRuns(),
      getSources()
    ]);
  const activeKeywords = keywords.filter((keyword) => keyword.active);
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const plannedQueryCount = activeKeywords.length * enabledProviders.length;
  const latestRun = findSummaryRun(runs, runId);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Sources</h1>
        <p className="page-kicker">
          Run governed discovery and collect candidate site roots for later review.
        </p>
      </header>

      <StatusMessage message={message} />

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

      <section className="panel stack-lg" aria-labelledby="source-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="source-list-title">
              Candidate sources
            </h2>
            <p className="panel-copy">
              {sources.length} site roots stored. Discovery creates pending sources only.
            </p>
          </div>
        </div>

        {sources.length ? (
          <div className="preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Site root</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>First discovered</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <a href={source.site_url} target="_blank" rel="noreferrer">
                        {source.site_url}
                      </a>
                    </td>
                    <td>{source.domain}</td>
                    <td>
                      <span className="status-pill" data-status={source.status}>
                        {source.status}
                      </span>
                    </td>
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
            <p>
              Run search after adding active keywords and enabling a provider.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
