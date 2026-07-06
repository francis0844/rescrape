"use client";

import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { approveSource, bulkUpdateStatus, rejectSource, rescanSourceAction, saveSourceNote } from "@/app/actions/review";
import type { SourceDiscoveryInfo, SourceRow } from "@/lib/app-data";

type ReviewQueueProps = {
  sources: SourceRow[];
  discoveryInfo: Record<string, SourceDiscoveryInfo>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet scanned";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function verdictNote(source: SourceRow) {
  if (source.status === "approved") {
    return "Human approved.";
  }

  if (source.status === "rejected") {
    return "Human rejected.";
  }

  if (source.status === "ai_approved") {
    return "AI said approve — human hasn't confirmed yet.";
  }

  if (source.status === "ai_rejected") {
    return "AI said reject — human hasn't confirmed yet.";
  }

  if (source.status === "needs_review") {
    return "AI could not decide — needs a human look.";
  }

  return null;
}

function formatSamplePreview(preview: unknown) {
  if (preview === null || preview === undefined) {
    return null;
  }

  try {
    return JSON.stringify(preview, null, 2);
  } catch {
    return String(preview);
  }
}

export function ReviewQueue({ sources, discoveryInfo }: ReviewQueueProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const allSelected = sources.length > 0 && selected.size === sources.length;

  const selectedIds = useMemo(() => [...selected], [selected]);

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

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sources.map((source) => source.id)));
  }

  function runBulk(status: "approved" | "rejected") {
    if (!selectedIds.length) {
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateStatus(selectedIds, status);
      setBulkMessage(`${result.updated} source(s) ${status}.`);
      setSelected(new Set());
      window.location.reload();
    });
  }

  if (!sources.length) {
    return (
      <div className="empty-state">
        <h3>Nothing to review</h3>
        <p>Sources land here once the verification agent produces a verdict.</p>
      </div>
    );
  }

  return (
    <div className="stack-md">
      <div className="bulk-bar">
        <label className="review-select">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          {selected.size ? `${selected.size} selected` : "Select all"}
        </label>
        <div className="row-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={!selectedIds.length || isPending}
            onClick={() => runBulk("approved")}
          >
            <Check size={16} aria-hidden="true" />
            Bulk approve
          </button>
          <button
            className="button button-danger"
            type="button"
            disabled={!selectedIds.length || isPending}
            onClick={() => runBulk("rejected")}
          >
            <X size={16} aria-hidden="true" />
            Bulk reject
          </button>
        </div>
      </div>

      {bulkMessage ? (
        <p className="status-message" role="status">
          {bulkMessage}
        </p>
      ) : null}

      <div className="review-list">
        {sources.map((source) => {
          const discovery = discoveryInfo[source.id];
          const samplePreview = formatSamplePreview(source.sample_preview);

          return (
            <article className="review-card" key={source.id}>
              <div className="review-card-head">
                <label className="review-select">
                  <input
                    type="checkbox"
                    checked={selected.has(source.id)}
                    onChange={() => toggle(source.id)}
                  />
                </label>
                <div className="review-card-title">
                  <a href={source.site_url} target="_blank" rel="noreferrer">
                    {source.site_url}
                    <ExternalLink size={14} aria-hidden="true" style={{ marginLeft: 4 }} />
                  </a>
                  <p className="row-meta">{source.title}</p>
                </div>
                <div className="stack-md" style={{ textAlign: "right" }}>
                  <span className="status-pill" data-status={source.status}>
                    {source.status}
                  </span>
                  {typeof source.ai_confidence === "number" ? (
                    <div className="confidence-row">
                      <div className="confidence-track">
                        <div
                          className="confidence-fill"
                          style={{ width: `${Math.round(source.ai_confidence * 100)}%` }}
                        />
                      </div>
                      {Math.round(source.ai_confidence * 100)}% confidence
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="review-verdict-note">{verdictNote(source)}</p>

              {source.ai_reason ? <p className="panel-copy">{source.ai_reason}</p> : null}

              {source.extractable_fields?.length ? (
                <div className="chip-row">
                  {source.extractable_fields.map((field) => (
                    <span className="chip" key={field}>
                      {field}
                    </span>
                  ))}
                </div>
              ) : null}

              {samplePreview ? <pre className="sample-preview">{samplePreview}</pre> : null}

              {source.evidence_urls?.length ? (
                <ul className="evidence-list">
                  {source.evidence_urls.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="review-meta">
                <span>Scanned: {formatDate(source.last_scanned_at)}</span>
                {discovery?.keywords.length ? (
                  <span>Keywords: {discovery.keywords.map((keyword) => keyword.label).join(", ")}</span>
                ) : null}
                {discovery?.runs.length ? (
                  <span>Runs: {discovery.runs.map((run) => run.label).join(", ")}</span>
                ) : null}
              </div>

              <form action={saveSourceNote} className="note-form">
                <input type="hidden" name="id" value={source.id} />
                <textarea
                  className="input textarea"
                  name="human_note"
                  placeholder="Reviewer note"
                  defaultValue={source.human_note ?? ""}
                />
                <button className="button button-secondary" type="submit">
                  Save note
                </button>
              </form>

              <div className="review-card-actions">
                <form action={rescanSourceAction}>
                  <input type="hidden" name="id" value={source.id} />
                  <button className="button button-secondary" type="submit">
                    <RotateCcw size={16} aria-hidden="true" />
                    Re-scan
                  </button>
                </form>
                <div className="row-actions">
                  <form action={rejectSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button className="button button-danger" type="submit">
                      <X size={16} aria-hidden="true" />
                      Reject
                    </button>
                  </form>
                  <form action={approveSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button className="button" type="submit">
                      <Check size={16} aria-hidden="true" />
                      Approve
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
