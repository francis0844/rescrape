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
  scan_step: string | null;
  first_discovered_at: string;
  last_scanned_at: string | null;
};

export type ScanJobRow = {
  id: string;
  status: "queued" | "running" | "paused" | "done" | "failed";
  total_sites: number;
  processed_sites: number;
  current_source_id: string | null;
  started_at: string | null;
  updated_at: string;
};

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

export async function getSources(limit = 50): Promise<SourceRow[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("sources")
    .select(
      "id, site_url, domain, title, snippet, status, ai_verdict, ai_confidence, ai_reason, scan_step, first_discovered_at, last_scanned_at"
    )
    .order("first_discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as SourceRow[];
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
    .select("id, status, total_sites, processed_sites, current_source_id, started_at, updated_at")
    .in("status", ["queued", "running", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ScanJobRow) ?? null;
}

export function normalizeKeywordKey(topic: string, location: string | null | undefined) {
  return `${topic.trim().toLowerCase()}::${(location ?? "").trim().toLowerCase()}`;
}
