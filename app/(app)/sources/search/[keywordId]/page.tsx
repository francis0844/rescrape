import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StatusMessage } from "@/components/status-message";
import { statusLabel } from "@/lib/status-label";
import { getKeywordById, getSourcesForKeyword } from "@/lib/app-data";

export const dynamic = "force-dynamic";

type SearchKeywordDetailPageProps = {
  params: Promise<{ keywordId: string }>;
  searchParams: Promise<{ message?: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scanned yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SearchKeywordDetailPage({
  params,
  searchParams
}: SearchKeywordDetailPageProps) {
  const { keywordId } = await params;
  const { message } = await searchParams;
  const [keyword, sources] = await Promise.all([
    getKeywordById(keywordId),
    getSourcesForKeyword(keywordId)
  ]);

  if (!keyword) {
    notFound();
  }

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <Link className="back-link" href="/sources/search">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to searched keywords
        </Link>
        <h1 className="page-title">
          {[keyword.topic, keyword.location].filter(Boolean).join(" · ")}
        </h1>
        <p className="page-kicker">
          {sources.length} site root{sources.length === 1 ? "" : "s"} discovered for this
          keyword.
        </p>
      </header>

      <StatusMessage message={message} />

      <section className="panel stack-lg" aria-labelledby="keyword-sources-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="keyword-sources-title">
              Site roots
            </h2>
            <p className="panel-copy">Scan them from the Scan page to get AI verdicts.</p>
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
                  <th>AI reason</th>
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
                        {source.status === "scanning" && source.scan_step
                          ? source.scan_step
                          : statusLabel(source.status)}
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
            <h3>No sites found</h3>
            <p>This keyword has not discovered any sites yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
