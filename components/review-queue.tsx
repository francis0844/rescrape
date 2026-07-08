"use client";

import { Check, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { approveSource, bulkUpdateStatus, rejectSource, rescanSourceAction, saveSourceNote } from "@/app/actions/review";
import { SubmitButton } from "@/components/submit-button";
import type { SourceDiscoveryInfo, SourceRow } from "@/lib/app-data";
import { statusLabel } from "@/lib/status-label";

type ReviewQueueProps = {
  sources: SourceRow[];
  discoveryInfo: Record<string, SourceDiscoveryInfo>;
  /** Where the per-card forms (approve/reject/rescan/note) redirect back to after submitting. */
  returnTo?: string;
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
    return "User Approved.";
  }

  if (source.status === "rejected") {
    return "User Rejected.";
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

export function ReviewQueue({
  sources,
  discoveryInfo,
  returnTo = "/sources/review"
}: ReviewQueueProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
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

    setBulkMessage(null);
    setPendingAction(status);
    startTransition(async () => {
      const result = await bulkUpdateStatus(selectedIds, status);
      setBulkMessage(`${result.updated} source(s) ${status}.`);
      setSelected(new Set());
      setPendingAction(null);
      router.refresh();
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
            aria-busy={pendingAction === "approved"}
            onClick={() => runBulk("approved")}
          >
            {pendingAction === "approved" ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="spin" />
                Approving...
              </>
            ) : (
              <>
                <Check size={16} aria-hidden="true" />
                Bulk approve
              </>
            )}
          </button>
          <button
            className="button button-danger"
            type="button"
            disabled={!selectedIds.length || isPending}
            aria-busy={pendingAction === "rejected"}
            onClick={() => runBulk("rejected")}
          >
            {pendingAction === "rejected" ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="spin" />
                Rejecting...
              </>
            ) : (
              <>
                <X size={16} aria-hidden="true" />
                Bulk reject
              </>
            )}
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
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <p className="row-meta">{source.title}</p>
                </div>
                <div className="review-card-status">
                  <span className="status-pill" data-status={source.status}>
                    {statusLabel(source.status)}
                  </span>
                  {typeof source.ai_confidence === "number" ? (
                    <div className="confidence-row">
                      <div className="progress-track progress-track--inline">
                        <div
                          className="progress-fill"
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
                <input type="hidden" name="returnTo" value={returnTo} />
                <textarea
                  className="input textarea"
                  name="human_note"
                  placeholder="Reviewer note"
                  defaultValue={source.human_note ?? ""}
                />
                <SubmitButton className="button button-secondary" pendingLabel="Saving...">
                  Save note
                </SubmitButton>
              </form>

              <div className="review-card-actions">
                <form action={rescanSourceAction}>
                  <input type="hidden" name="id" value={source.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <SubmitButton className="button button-secondary" pendingLabel="Re-scanning...">
                    <RotateCcw size={16} aria-hidden="true" />
                    Re-scan
                  </SubmitButton>
                </form>
                <div className="row-actions">
                  <form action={rejectSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton className="button button-danger" pendingLabel="Rejecting...">
                      <X size={16} aria-hidden="true" />
                      Reject (User Rejected)
                    </SubmitButton>
                  </form>
                  <form action={approveSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton className="button" pendingLabel="Approving...">
                      <Check size={16} aria-hidden="true" />
                      Approve (User Approved)
                    </SubmitButton>
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
