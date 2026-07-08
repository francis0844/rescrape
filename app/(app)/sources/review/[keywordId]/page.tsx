import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ReviewQueue } from "@/components/review-queue";
import { StatusMessage } from "@/components/status-message";
import {
  getDiscoveryInfoForSources,
  getFilteredSources,
  getKeywordById,
  getRecentSearchRuns,
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

type ReviewKeywordDetailPageProps = {
  params: Promise<{ keywordId: string }>;
  searchParams: Promise<{
    message?: string;
    status?: string;
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

export default async function ReviewKeywordDetailPage({
  params,
  searchParams
}: ReviewKeywordDetailPageProps) {
  const { keywordId } = await params;
  const searchParamsValue = await searchParams;
  const [keyword, runs] = await Promise.all([
    getKeywordById(keywordId),
    getRecentSearchRuns(50)
  ]);

  if (!keyword) {
    notFound();
  }

  const statuses = parseStatuses(searchParamsValue.status);
  const minConfidence = searchParamsValue.minConfidence
    ? Number(searchParamsValue.minConfidence)
    : undefined;

  const sources = await getFilteredSources({
    statuses,
    keywordId,
    runId: searchParamsValue.filterRunId || undefined,
    minConfidence: Number.isFinite(minConfidence) ? minConfidence : undefined
  });
  const discoveryInfo = await getDiscoveryInfoForSources(sources.map((source) => source.id));
  const returnTo = `/sources/review/${keywordId}`;

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <Link className="back-link" href="/sources/review">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to searched keywords
        </Link>
        <h1 className="page-title">
          {[keyword.topic, keyword.location].filter(Boolean).join(" · ")}
        </h1>
        <p className="page-kicker">
          A human always makes the final call — User Approved or User Rejected.
        </p>
      </header>

      <StatusMessage message={searchParamsValue.message} />

      <section className="panel stack-lg" aria-labelledby="review-keyword-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="review-keyword-title">
              Sources
            </h2>
            <p className="panel-copy">
              AI verdicts are suggestions — nothing here is trusted until a human approves it.
            </p>
          </div>
        </div>

        <form className="filter-form" method="get">
          <label className="field">
            <span className="label">Status</span>
            <select className="input" name="status" defaultValue={statuses.join(",")}>
              <option value="ai_approved,needs_review">AI approved + needs review</option>
              <option value="ai_approved">AI approved only</option>
              <option value="ai_rejected">AI rejected only</option>
              <option value="needs_review">Needs review only</option>
              <option value="approved">User Approved</option>
              <option value="rejected">User Rejected</option>
              <option value={REVIEW_STATUSES.join(",")}>All reviewed states</option>
            </select>
          </label>
          <label className="field">
            <span className="label">Run</span>
            <select
              className="input"
              name="filterRunId"
              defaultValue={searchParamsValue.filterRunId ?? ""}
            >
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
              defaultValue={searchParamsValue.minConfidence ?? ""}
              placeholder="0.0 – 1.0"
            />
          </label>
          <button className="button button-secondary fit-content" type="submit">
            Apply filters
          </button>
        </form>

        <ReviewQueue sources={sources} discoveryInfo={discoveryInfo} returnTo={returnTo} />
      </section>
    </div>
  );
}
