import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";

export type SearchProviderRow = {
  id: string;
  name: string;
  enabled: boolean;
  api_key_env: string;
  default_result_cap: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AppSettingsRow = {
  id: string;
  include_domains: string[];
  result_cap_per_query: number;
  crawl_max_pages: number;
  crawl_max_depth: number;
  crawl_char_budget: number;
  chunk_size: number;
  updated_at: string;
};

export type KeywordRow = {
  id: string;
  topic: string;
  location: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SearchRunRow = {
  id: string;
  status: "queued" | "running" | "done" | "partial" | "failed";
  started_at: string | null;
  finished_at: string | null;
  query_count: number;
  result_count: number;
  credits_spent_est: number;
  keywords_snapshot: unknown;
  providers_snapshot: unknown;
};

export type SourceRow = {
  id: string;
  site_url: string;
  domain: string;
  title: string;
  snippet: string;
  status:
    | "pending"
    | "scanning"
    | "ai_approved"
    | "ai_rejected"
    | "needs_review"
    | "approved"
    | "rejected";
  ai_verdict: "approve" | "reject" | "needs_review" | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  extractable_fields: string[] | null;
  sample_preview: unknown;
  evidence_urls: string[] | null;
  human_note: string | null;
  scan_step: string | null;
  first_discovered_at: string;
  last_scanned_at: string | null;
};

export type SourceDiscoveryInfo = {
  keywords: { id: string; label: string }[];
  runs: { id: string; label: string }[];
};

export type ScanJobRow = {
  id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  total_sites: number;
  processed_sites: number;
  current_source_id: string | null;
  keyword_ids: string[] | null;
  started_at: string | null;
  updated_at: string;
};

export type KeywordScanState = "unscanned" | "scanning" | "partially_scanned" | "scanned";

export type KeywordSearchSummary = {
  keywordId: string;
  topic: string;
  location: string | null;
  totalSources: number;
  statusCounts: Partial<Record<SourceRow["status"], number>>;
  scanState: KeywordScanState;
  lastDiscoveredAt: string | null;
};

const RESOLVED_STATUSES: SourceRow["status"][] = [
  "ai_approved",
  "ai_rejected",
  "needs_review",
  "approved",
  "rejected"
];

export const defaultSettings: AppSettingsRow = {
  id: "local-default",
  include_domains: [],
  result_cap_per_query: 10,
  crawl_max_pages: 15,
  crawl_max_depth: 1,
  crawl_char_budget: 60000,
  chunk_size: 5,
  updated_at: new Date(0).toISOString()
};

export const defaultProvider: SearchProviderRow = {
  id: "local-tavily",
  name: "Tavily",
  enabled: true,
  api_key_env: "TAVILY_API_KEY",
  default_result_cap: 10,
  config: {},
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString()
};

export async function getSearchProviders(): Promise<SearchProviderRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [defaultProvider];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("search_providers")
    .select(
      "id, name, enabled, api_key_env, default_result_cap, config, created_at, updated_at"
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SearchProviderRow[];
}

export async function getAppSettings(): Promise<AppSettingsRow> {
  if (!hasSupabaseServiceEnv()) {
    return defaultSettings;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select(
      "id, include_domains, result_cap_per_query, crawl_max_pages, crawl_max_depth, crawl_char_budget, chunk_size, updated_at"
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("app_settings")
      .insert({
        include_domains: [],
        result_cap_per_query: 10,
        crawl_max_pages: 15,
        crawl_max_depth: 1,
        crawl_char_budget: 60000,
        chunk_size: 5
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return inserted as AppSettingsRow;
  }

  return data as AppSettingsRow;
}

export async function getKeywords(): Promise<KeywordRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("keywords")
    .select("id, topic, location, notes, active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as KeywordRow[];
}

export async function getRecentSearchRuns(limit = 5): Promise<SearchRunRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("search_runs")
    .select(
      "id, status, started_at, finished_at, query_count, result_count, credits_spent_est, keywords_snapshot, providers_snapshot"
    )
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as SearchRunRow[];
}

/** No limit — used only for the full CSV export, not for on-screen rendering. */
export async function getAllSourcesForExport(): Promise<SourceRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, site_url, domain, title, snippet, status, ai_verdict, ai_confidence, ai_reason, extractable_fields, sample_preview, evidence_urls, human_note, scan_step, first_discovered_at, last_scanned_at"
    )
    .order("first_discovered_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SourceRow[];
}

export async function getSources(limit = 50): Promise<SourceRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, site_url, domain, title, snippet, status, ai_verdict, ai_confidence, ai_reason, extractable_fields, sample_preview, evidence_urls, human_note, scan_step, first_discovered_at, last_scanned_at"
    )
    .order("first_discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as SourceRow[];
}

export type ReviewFilters = {
  statuses: SourceRow["status"][];
  keywordId?: string;
  runId?: string;
  minConfidence?: number;
};

export async function getFilteredSources(
  filters: ReviewFilters,
  limit = 100
): Promise<SourceRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("sources")
    .select(
      "id, site_url, domain, title, snippet, status, ai_verdict, ai_confidence, ai_reason, extractable_fields, sample_preview, evidence_urls, human_note, scan_step, first_discovered_at, last_scanned_at"
    )
    .in("status", filters.statuses)
    .order("last_scanned_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (typeof filters.minConfidence === "number") {
    query = query.gte("ai_confidence", filters.minConfidence);
  }

  if (filters.keywordId || filters.runId) {
    const discoveryQuery = supabase.from("source_discoveries").select("source_id");

    if (filters.keywordId) {
      discoveryQuery.eq("keyword_id", filters.keywordId);
    }

    if (filters.runId) {
      discoveryQuery.eq("run_id", filters.runId);
    }

    const { data: discoveries, error: discoveryError } = await discoveryQuery;

    if (discoveryError) {
      throw discoveryError;
    }

    const sourceIds = [...new Set((discoveries ?? []).map((row) => row.source_id as string))];

    if (!sourceIds.length) {
      return [];
    }

    query = query.in("id", sourceIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as SourceRow[];
}

export async function getDiscoveryInfoForSources(
  sourceIds: string[]
): Promise<Record<string, SourceDiscoveryInfo>> {
  if (!hasSupabaseServiceEnv() || !sourceIds.length) {
    return {};
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("source_discoveries")
    .select(
      "source_id, keywords(id, topic, location), search_runs(id, started_at)"
    )
    .in("source_id", sourceIds);

  if (error) {
    throw error;
  }

  const result: Record<string, SourceDiscoveryInfo> = {};

  type DiscoveryJoinRow = {
    source_id: string;
    keywords: { id: string; topic: string; location: string | null } | null;
    search_runs: { id: string; started_at: string | null } | null;
  };

  for (const row of (data ?? []) as unknown as DiscoveryJoinRow[]) {
    const entry = result[row.source_id] ?? { keywords: [], runs: [] };

    if (row.keywords && !entry.keywords.some((keyword) => keyword.id === row.keywords!.id)) {
      entry.keywords.push({
        id: row.keywords.id,
        label: [row.keywords.topic, row.keywords.location].filter(Boolean).join(" · ")
      });
    }

    if (row.search_runs && !entry.runs.some((run) => run.id === row.search_runs!.id)) {
      entry.runs.push({
        id: row.search_runs.id,
        label: row.search_runs.started_at
          ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(row.search_runs.started_at)
            )
          : "Unstarted run"
      });
    }

    result[row.source_id] = entry;
  }

  return result;
}

export type SourceStatusCounts = Record<SourceRow["status"], number>;

export async function getSourceStatusCounts(): Promise<SourceStatusCounts> {
  const empty: SourceStatusCounts = {
    pending: 0,
    scanning: 0,
    ai_approved: 0,
    ai_rejected: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0
  };

  if (!hasSupabaseServiceEnv()) {
    return empty;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("sources").select("status");

  if (error) {
    throw error;
  }

  const counts = { ...empty };

  for (const row of (data ?? []) as { status: SourceRow["status"] }[]) {
    counts[row.status] += 1;
  }

  return counts;
}

export async function getPendingSourceCount(): Promise<number> {
  if (!hasSupabaseServiceEnv()) {
    return 0;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "scanning"]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getActiveScanJob(): Promise<ScanJobRow | null> {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("scan_jobs")
    .select(
      "id, status, total_sites, processed_sites, current_source_id, keyword_ids, started_at, updated_at"
    )
    .in("status", ["queued", "running", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScanJobRow) ?? null;
}

type KeywordDiscoveryJoinRow = {
  keyword_id: string;
  source_id: string;
  discovered_at: string;
  keywords: { id: string; topic: string; location: string | null } | null;
  sources: { status: SourceRow["status"] } | null;
};

function computeScanState(statuses: SourceRow["status"][]): KeywordScanState {
  if (statuses.every((status) => status === "pending")) {
    return "unscanned";
  }

  if (statuses.some((status) => status === "scanning")) {
    return "scanning";
  }

  if (statuses.every((status) => RESOLVED_STATUSES.includes(status))) {
    return "scanned";
  }

  return "partially_scanned";
}

/** One row per keyword that has ever discovered at least one source, aggregated at POC scale in JS. */
export async function getKeywordSearchSummaries(): Promise<KeywordSearchSummary[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("source_discoveries")
    .select(
      "keyword_id, source_id, discovered_at, keywords(id, topic, location), sources(status)"
    )
    .order("discovered_at", { ascending: false });

  if (error) {
    throw error;
  }

  const byKeyword = new Map<
    string,
    {
      topic: string;
      location: string | null;
      sources: Map<string, SourceRow["status"]>;
      lastDiscoveredAt: string | null;
    }
  >();

  for (const row of (data ?? []) as unknown as KeywordDiscoveryJoinRow[]) {
    if (!row.keywords || !row.sources) {
      continue;
    }

    const entry = byKeyword.get(row.keyword_id) ?? {
      topic: row.keywords.topic,
      location: row.keywords.location,
      sources: new Map<string, SourceRow["status"]>(),
      lastDiscoveredAt: row.discovered_at
    };

    entry.sources.set(row.source_id, row.sources.status);

    if (!entry.lastDiscoveredAt || row.discovered_at > entry.lastDiscoveredAt) {
      entry.lastDiscoveredAt = row.discovered_at;
    }

    byKeyword.set(row.keyword_id, entry);
  }

  return [...byKeyword.entries()]
    .map(([keywordId, entry]) => {
      const statuses = [...entry.sources.values()];
      const statusCounts: Partial<Record<SourceRow["status"], number>> = {};

      for (const status of statuses) {
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      }

      return {
        keywordId,
        topic: entry.topic,
        location: entry.location,
        totalSources: statuses.length,
        statusCounts,
        scanState: computeScanState(statuses),
        lastDiscoveredAt: entry.lastDiscoveredAt
      };
    })
    .sort((a, b) => (b.lastDiscoveredAt ?? "").localeCompare(a.lastDiscoveredAt ?? ""));
}

export async function getKeywordById(keywordId: string): Promise<KeywordRow | null> {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("keywords")
    .select("id, topic, location, notes, active, created_at, updated_at")
    .eq("id", keywordId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as KeywordRow) ?? null;
}

export async function getSourceIdsForKeywords(keywordIds: string[]): Promise<string[]> {
  if (!hasSupabaseServiceEnv() || !keywordIds.length) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("source_discoveries")
    .select("source_id")
    .in("keyword_id", keywordIds);

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((row) => row.source_id as string))];
}

export async function getSourcesForKeyword(keywordId: string): Promise<SourceRow[]> {
  const sourceIds = await getSourceIdsForKeywords([keywordId]);

  if (!sourceIds.length) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, site_url, domain, title, snippet, status, ai_verdict, ai_confidence, ai_reason, extractable_fields, sample_preview, evidence_urls, human_note, scan_step, first_discovered_at, last_scanned_at"
    )
    .in("id", sourceIds)
    .order("first_discovered_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SourceRow[];
}

export function normalizeKeywordKey(topic: string, location: string | null | undefined) {
  return `${topic.trim().toLowerCase()}::${(location ?? "").trim().toLowerCase()}`;
}
