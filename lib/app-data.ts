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

export function normalizeKeywordKey(topic: string, location: string | null | undefined) {
  return `${topic.trim().toLowerCase()}::${(location ?? "").trim().toLowerCase()}`;
}
