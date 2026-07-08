"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ScanPanel, type ScanJobState } from "@/components/scan-panel";
import type { KeywordSearchSummary } from "@/lib/app-data";

type ScanKeywordSelectorProps = {
  summaries: KeywordSearchSummary[];
  globalPendingCount: number;
  initialJob: ScanJobState | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not searched yet";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

export function ScanKeywordSelector({
  summaries,
  globalPendingCount,
  initialJob
}: ScanKeywordSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  const selectedIds = useMemo(() => [...selected], [selected]);
  const selectedPendingCount = useMemo(() => {
    if (!selectedIds.length) {
      return globalPendingCount;
    }

    return summaries
      .filter((summary) => selected.has(summary.keywordId))
      .reduce(
        (sum, summary) =>
          sum + (summary.statusCounts.pending ?? 0) + (summary.statusCounts.scanning ?? 0),
        0
      );
  }, [globalPendingCount, selected, selectedIds.length, summaries]);

  return (
    <div className="stack-xl">
      <section className="panel stack-lg" aria-labelledby="scan-keyword-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="scan-keyword-list-title">
              Searched keywords
            </h2>
            <p className="panel-copy">
              Select which keywords&apos; sites to scan. Leave nothing selected to scan
              everything pending.
            </p>
          </div>
        </div>

        {summaries.length ? (
          <div className="preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th />
                  <th>Keyword</th>
                  <th>Sites found</th>
                  <th>Scan status</th>
                  <th>Last searched</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.keywordId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(summary.keywordId)}
                        onChange={() => toggle(summary.keywordId)}
                        aria-label={`Select ${summary.topic}`}
                      />
                    </td>
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
                        href={`/sources/scan/${summary.keywordId}`}
                      >
                        View
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
            <p>Run a search first, then come back here to scan what it found.</p>
          </div>
        )}
      </section>

      <ScanPanel
        pendingCount={selectedPendingCount}
        initialJob={initialJob}
        keywordIds={selectedIds.length ? selectedIds : undefined}
        title={selectedIds.length ? `Scan ${selectedIds.length} selected keyword(s)` : "Scan all sites"}
        description={
          selectedIds.length
            ? "Crawls only the pending sites for your selected keywords. Stays open on this tab — closing it pauses the batch; Resume picks up where it left off."
            : "No keywords selected — this scans every pending site across all keywords. Crawls each pending site and asks the verification agent for a judgment. Stays open on this tab — closing it pauses the batch; Resume picks up where it left off."
        }
        startLabel={selectedIds.length ? `Scan ${selectedIds.length} selected` : "Scan all sites"}
      />
    </div>
  );
}
