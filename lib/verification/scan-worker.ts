import "server-only";

import { getAppSettings } from "@/lib/app-data";
import type { SearchProvider } from "@/lib/providers/search-provider";
import { getEnabledSearchProviders, getVerificationAgent } from "@/lib/providers/registry";
import type { VerificationAgent, VerificationRequest } from "@/lib/providers/verification-agent";
import { crawlSite } from "@/lib/verification/crawler";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type ScanJobRow = {
  id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  total_sites: number;
  processed_sites: number;
  current_source_id: string | null;
  started_at: string | null;
  updated_at: string;
};

type EligibleSourceRow = {
  id: string;
  site_url: string;
};

const RETRY_DELAYS_MS = [500, 1500];
const ELIGIBLE_STATUSES = ["pending", "scanning"];

async function countEligible(sinceIso: string): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true })
    .in("status", ELIGIBLE_STATUSES)
    .or(`last_scanned_at.is.null,last_scanned_at.lt.${sinceIso}`);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchNextEligible(sinceIso: string, limit: number): Promise<EligibleSourceRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id, site_url")
    .in("status", ELIGIBLE_STATUSES)
    .or(`last_scanned_at.is.null,last_scanned_at.lt.${sinceIso}`)
    .order("first_discovered_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as EligibleSourceRow[];
}

async function judgeWithRetry(agent: VerificationAgent, request: VerificationRequest) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await agent.judge(request);
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }

  throw lastError;
}

type ProcessableSource = {
  id: string;
  site_url: string;
};

/**
 * Crawls + judges a single source and persists the result. Shared by the chunked
 * "Scan all sites" loop and the Phase 3 per-source Re-scan action so both paths move
 * a source through the same pending → scanning → {ai_approved|ai_rejected|needs_review}
 * rule (never approved/rejected — that stays human-only).
 */
async function processSource(
  source: ProcessableSource,
  settings: Awaited<ReturnType<typeof getAppSettings>>,
  extractProvider: SearchProvider | null,
  agent: VerificationAgent
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const onStep = async (step: string) => {
    await supabase.from("sources").update({ scan_step: step }).eq("id", source.id);
  };

  const outcome = await crawlSite({
    siteUrl: source.site_url,
    maxPages: settings.crawl_max_pages,
    maxDepth: settings.crawl_max_depth,
    charBudget: settings.crawl_char_budget,
    extractProvider,
    onStep
  });

  if (outcome.kind === "blocked") {
    await supabase
      .from("sources")
      .update({
        status: "needs_review",
        ai_verdict: "needs_review",
        ai_confidence: null,
        ai_reason: "crawling disallowed",
        extractable_fields: null,
        sample_preview: null,
        evidence_urls: [],
        scan_step: null,
        last_scanned_at: new Date().toISOString()
      })
      .eq("id", source.id);
    return;
  }

  if (outcome.kind === "empty") {
    await supabase
      .from("sources")
      .update({
        status: "needs_review",
        ai_verdict: "needs_review",
        ai_confidence: null,
        ai_reason: outcome.message,
        extractable_fields: null,
        sample_preview: null,
        evidence_urls: [],
        scan_step: null,
        last_scanned_at: new Date().toISOString()
      })
      .eq("id", source.id);
    return;
  }

  await onStep("judging");
  const evidenceUrls = outcome.pages.map((page) => page.url);

  try {
    const verdict = await judgeWithRetry(agent, {
      sourceId: source.id,
      siteUrl: source.site_url,
      evidenceUrls,
      pageText: outcome.combinedText
    });
    const statusForVerdict = {
      approve: "ai_approved",
      reject: "ai_rejected",
      needs_review: "needs_review"
    } as const;

    await onStep("verdict");
    await supabase
      .from("sources")
      .update({
        status: statusForVerdict[verdict.verdict],
        ai_verdict: verdict.verdict,
        ai_confidence: verdict.confidence,
        ai_reason: verdict.reason,
        extractable_fields: verdict.extractableFields,
        sample_preview: verdict.samplePreview,
        evidence_urls: verdict.evidenceUrls,
        scan_step: null,
        last_scanned_at: new Date().toISOString()
      })
      .eq("id", source.id);
  } catch (error) {
    // Repeated agent failure: never falsely reject — leave pending so a future scan retries.
    await supabase
      .from("sources")
      .update({
        status: "pending",
        ai_reason:
          error instanceof Error ? error.message : "Verification agent failed after retries.",
        scan_step: null,
        last_scanned_at: new Date().toISOString()
      })
      .eq("id", source.id);
  }
}

/** Re-scans a single source on demand (Phase 3 action): resets to scanning, reuses the
 *  same crawl+judge worker, and preserves everything else (human_note, discoveries, history). */
export async function rescanSource(sourceId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: source, error } = await supabase
    .from("sources")
    .select("id, site_url")
    .eq("id", sourceId)
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from("sources")
    .update({ status: "scanning", scan_step: "fetching" })
    .eq("id", sourceId);

  const settings = await getAppSettings();
  const providers = await getEnabledSearchProviders();
  const extractProvider = providers[0] ?? null;
  const agent = getVerificationAgent();

  await processSource(source as ProcessableSource, settings, extractProvider, agent);
}

/** Resumes the active job if one exists, otherwise starts a fresh one over currently eligible sources. */
export async function ensureScanJob(): Promise<ScanJobRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing, error: existingError } = await supabase
    .from("scan_jobs")
    .select("*")
    .in("status", ["queued", "running", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as ScanJobRow;
  }

  const startedAt = new Date().toISOString();
  const totalSites = await countEligible(startedAt);

  const { data: created, error: createError } = await supabase
    .from("scan_jobs")
    .insert({
      status: "running",
      total_sites: totalSites,
      processed_sites: 0,
      started_at: startedAt
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return created as ScanJobRow;
}

export async function getScanJob(jobId: string): Promise<ScanJobRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("scan_jobs").select("*").eq("id", jobId).maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScanJobRow) ?? null;
}

export type ScanChunkResult = {
  job: ScanJobRow;
  done: boolean;
};

/** Pure over scan_jobs + sources: processes one chunk_size batch and reports the resulting job state. */
export async function runScanChunk(jobId: string): Promise<ScanChunkResult> {
  const supabase = createSupabaseServiceRoleClient();
  const job = await getScanJob(jobId);

  if (!job) {
    throw new Error(`Scan job ${jobId} not found.`);
  }

  if (job.status === "done" || job.status === "failed") {
    return { job, done: true };
  }

  const settings = await getAppSettings();
  const sinceIso = job.started_at ?? new Date(0).toISOString();
  const batch = await fetchNextEligible(sinceIso, settings.chunk_size);

  if (!batch.length) {
    const { data: finished, error: finishError } = await supabase
      .from("scan_jobs")
      .update({ status: "done", current_source_id: null })
      .eq("id", jobId)
      .select("*")
      .single();

    if (finishError) {
      throw finishError;
    }

    return { job: finished as ScanJobRow, done: true };
  }

  const providers = await getEnabledSearchProviders();
  const extractProvider = providers[0] ?? null;
  const agent = getVerificationAgent();
  let processed = 0;

  for (const source of batch) {
    await supabase
      .from("sources")
      .update({ status: "scanning", scan_step: "fetching" })
      .eq("id", source.id);
    await supabase
      .from("scan_jobs")
      .update({ current_source_id: source.id, status: "running" })
      .eq("id", jobId);

    await processSource(source, settings, extractProvider, agent);

    processed += 1;
  }

  const remaining = await countEligible(sinceIso);
  const { data: updatedJob, error: updateError } = await supabase
    .from("scan_jobs")
    .update({
      processed_sites: job.processed_sites + processed,
      status: remaining > 0 ? "running" : "done",
      current_source_id: null
    })
    .eq("id", jobId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  return { job: updatedJob as ScanJobRow, done: remaining === 0 };
}
