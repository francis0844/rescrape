"use client";

import { Loader2, PlayCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchScanJob, startScan, tickScan } from "@/app/actions/verification";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ScanJobState = {
  id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  totalSites: number;
  processedSites: number;
  currentSourceId: string | null;
};

type CurrentSite = {
  siteUrl: string;
  scanStep: string | null;
};

type ScanPanelProps = {
  pendingCount: number;
  initialJob: ScanJobState | null;
  /** When set, "Scan" only scans these keywords' sources instead of every eligible source. */
  keywordIds?: string[];
  title?: string;
  description?: string;
  startLabel?: string;
};

function toJobState(row: {
  id: string;
  status: ScanJobState["status"];
  total_sites: number;
  processed_sites: number;
  current_source_id: string | null;
}): ScanJobState {
  return {
    id: row.id,
    status: row.status,
    totalSites: row.total_sites,
    processedSites: row.processed_sites,
    currentSourceId: row.current_source_id
  };
}

export function ScanPanel({
  pendingCount,
  initialJob,
  keywordIds,
  title = "Scan all sites",
  startLabel = "Scan all sites",
  description = "Crawls each pending site and asks the verification agent for a judgment. Stays open on this tab — closing it pauses the batch; Resume picks up where it left off."
}: ScanPanelProps) {
  const [job, setJob] = useState<ScanJobState | null>(initialJob);
  const [currentSite, setCurrentSite] = useState<CurrentSite | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);

  const isActive = job !== null && job.status !== "done" && job.status !== "failed";
  const progressPct = useMemo(() => {
    if (!job || job.totalSites === 0) {
      return job?.status === "done" ? 100 : 0;
    }

    return Math.min(100, Math.round((job.processedSites / job.totalSites) * 100));
  }, [job]);

  useEffect(() => {
    if (!job) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`scan-job-${job.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scan_jobs", filter: `id=eq.${job.id}` },
        (payload) => {
          setJob(toJobState(payload.new as Parameters<typeof toJobState>[0]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sources", filter: "status=eq.scanning" },
        (payload) => {
          const row = payload.new as { site_url: string; scan_step: string | null };
          setCurrentSite({ siteUrl: row.site_url, scanStep: row.scan_step });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  async function runLoop(jobId: string) {
    stopRef.current = false;
    setRunning(true);
    setError(null);

    try {
      let done = false;

      while (!done && !stopRef.current) {
        const result = await tickScan(jobId);
        setJob(toJobState(result.job));
        done = result.done;

        if (!done) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Scan run failed unexpectedly.");
    } finally {
      setRunning(false);
      if (stopRef.current) {
        stopRef.current = false;
      }
    }
  }

  async function handleStart() {
    setError(null);

    try {
      const created = await startScan(keywordIds);
      setJob(toJobState(created));
      await runLoop(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the scan.");
    }
  }

  async function handleResume() {
    if (!job) {
      return;
    }

    setError(null);

    try {
      const latest = await fetchScanJob(job.id);

      if (latest) {
        setJob(toJobState(latest));
      }

      await runLoop(job.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resume the scan.");
    }
  }

  useEffect(() => {
    return () => {
      stopRef.current = true;
    };
  }, []);

  const showResume = isActive && !running;

  return (
    <section className="panel stack-lg" aria-labelledby="scan-panel-title">
      <div className="section-heading">
        <div>
          <h2 className="panel-title" id="scan-panel-title">
            {title}
          </h2>
          <p className="panel-copy">{description}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-tile">
          <span className="metric-label">Pending sites</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="metric-tile">
          <span className="metric-label">Job status</span>
          <strong>{job ? job.status : "idle"}</strong>
        </div>
        <div className="metric-tile">
          <span className="metric-label">Processed</span>
          <strong>
            {job ? `${job.processedSites} / ${job.totalSites}` : "0 / 0"}
          </strong>
        </div>
      </div>

      {job ? (
        <div className="stack-md">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="scan-status-row">
            {running && currentSite ? (
              <span className="scan-current-site">
                <span className="scan-pulse" aria-hidden="true" />
                <strong>{currentSite.siteUrl}</strong>
                {currentSite.scanStep ? ` — ${currentSite.scanStep}` : null}
              </span>
            ) : (
              <span className="scan-current-site">
                {job.status === "done" ? "Scan complete." : "Not currently scanning."}
              </span>
            )}
            <span className="pill">{progressPct}%</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="status-message" role="alert">
          {error}
        </p>
      ) : null}

      <div className="row-actions">
        {!running && (!job || job.status === "done" || job.status === "failed") ? (
          <button
            className="button fit-content"
            type="button"
            onClick={handleStart}
            disabled={pendingCount === 0}
          >
            <PlayCircle size={16} aria-hidden="true" />
            {startLabel}
          </button>
        ) : null}

        {running ? (
          <button className="button fit-content" type="button" disabled>
            <Loader2 size={16} aria-hidden="true" className="spin" />
            Scanning…
          </button>
        ) : null}

        {showResume ? (
          <button
            className="button button-secondary fit-content"
            type="button"
            onClick={handleResume}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Resume
          </button>
        ) : null}
      </div>

      {pendingCount === 0 && !job ? (
        <p className="panel-copy">No pending sites to scan. Run search to find more.</p>
      ) : null}
    </section>
  );
}
