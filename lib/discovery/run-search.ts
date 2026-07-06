import "server-only";

import { getAppSettings, type KeywordRow } from "@/lib/app-data";
import { toSiteIdentity } from "@/lib/discovery/url";
import { getEnabledSearchProviders } from "@/lib/providers/registry";
import type { SearchProvider, SearchResult } from "@/lib/providers/search-provider";
import { TavilySearchError } from "@/lib/providers/tavily-search-provider";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";

export type RunSearchResult = {
  runId: string | null;
  status: "done" | "partial" | "failed";
  queryCount: number;
  plannedQueryCount: number;
  resultCount: number;
  creditsSpentEst: number;
  message: string;
};

type SourceRow = {
  id: string;
  site_url: string;
};

type KeywordSnapshot = {
  id: string;
  topic: string;
  location: string | null;
  query: string;
};

type ProviderSnapshot = {
  id: string;
  name: string;
  defaultResultCap: number;
};

function buildQuery(keyword: KeywordRow) {
  return [keyword.topic.trim(), keyword.location?.trim()].filter(Boolean).join(" ");
}

function isCreditLimitError(error: unknown) {
  return (
    error instanceof TavilySearchError &&
    [429, 432, 433].includes(error.status)
  );
}

async function getActiveKeywords() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("keywords")
    .select("id, topic, location, notes, active, created_at, updated_at")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as KeywordRow[];
}

function providerSnapshot(provider: SearchProvider): ProviderSnapshot {
  return {
    id: provider.id,
    name: provider.name,
    defaultResultCap: provider.defaultResultCap
  };
}

async function findOrCreateSource(input: {
  result: SearchResult;
  siteUrl: string;
  domain: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing, error: existingError } = await supabase
    .from("sources")
    .select("id, site_url")
    .eq("site_url", input.siteUrl)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return {
      source: existing as SourceRow,
      created: false
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("sources")
    .insert({
      site_url: input.siteUrl,
      domain: input.domain,
      title: input.result.title,
      snippet: input.result.snippet,
      status: "pending"
    })
    .select("id, site_url")
    .single();

  if (insertError) {
    const { data: racedExisting, error: racedError } = await supabase
      .from("sources")
      .select("id, site_url")
      .eq("site_url", input.siteUrl)
      .maybeSingle();

    if (racedError || !racedExisting) {
      throw insertError;
    }

    return {
      source: racedExisting as SourceRow,
      created: false
    };
  }

  return {
    source: inserted as SourceRow,
    created: true
  };
}

async function recordDiscovery(input: {
  sourceId: string;
  keywordId: string;
  runId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("source_discoveries").insert({
    source_id: input.sourceId,
    keyword_id: input.keywordId,
    run_id: input.runId
  });

  if (error) {
    throw error;
  }
}

export async function runDiscoverySearch(): Promise<RunSearchResult> {
  if (!hasSupabaseServiceEnv()) {
    return {
      runId: null,
      status: "failed",
      queryCount: 0,
      plannedQueryCount: 0,
      resultCount: 0,
      creditsSpentEst: 0,
      message: "Supabase environment variables are required before a search run can start."
    };
  }

  const [settings, keywords, providers] = await Promise.all([
    getAppSettings(),
    getActiveKeywords(),
    getEnabledSearchProviders()
  ]);

  if (!keywords.length) {
    return {
      runId: null,
      status: "failed",
      queryCount: 0,
      plannedQueryCount: 0,
      resultCount: 0,
      creditsSpentEst: 0,
      message: "Create at least one active keyword before running search."
    };
  }

  if (!providers.length) {
    return {
      runId: null,
      status: "failed",
      queryCount: 0,
      plannedQueryCount: keywords.length,
      resultCount: 0,
      creditsSpentEst: 0,
      message: "Enable a search provider before running search."
    };
  }

  const keywordSnapshots: KeywordSnapshot[] = keywords.map((keyword) => ({
    id: keyword.id,
    topic: keyword.topic,
    location: keyword.location,
    query: buildQuery(keyword)
  }));
  const providerSnapshots = providers.map(providerSnapshot);
  const plannedQueryCount = keywordSnapshots.length * providers.length;
  const supabase = createSupabaseServiceRoleClient();
  const { data: run, error: runError } = await supabase
    .from("search_runs")
    .insert({
      status: "running",
      started_at: new Date().toISOString(),
      query_count: 0,
      result_count: 0,
      credits_spent_est: 0,
      keywords_snapshot: keywordSnapshots,
      providers_snapshot: providerSnapshots
    })
    .select("id")
    .single();

  if (runError) {
    throw runError;
  }

  const runId = run.id as string;
  let queryCount = 0;
  let resultCount = 0;
  let creditsSpentEst = 0;
  let status: "done" | "partial" | "failed" = "done";
  let message = "Search run completed.";
  const discoveriesRecorded = new Set<string>();

  try {
    for (const provider of providers) {
      for (const keyword of keywords) {
        const query = buildQuery(keyword);

        try {
          const response = await provider.search({
            query,
            resultCap: Math.min(
              settings.result_cap_per_query,
              provider.defaultResultCap
            ),
            includeDomains: settings.include_domains
          });
          queryCount += 1;
          creditsSpentEst += response.creditsSpent;

          for (const result of response.results) {
            const identity = toSiteIdentity(result.url);

            if (!identity) {
              continue;
            }

            const { source, created } = await findOrCreateSource({
              result,
              siteUrl: identity.siteUrl,
              domain: identity.domain
            });

            const discoveryKey = `${source.id}:${keyword.id}`;

            if (!discoveriesRecorded.has(discoveryKey)) {
              await recordDiscovery({
                sourceId: source.id,
                keywordId: keyword.id,
                runId
              });
              discoveriesRecorded.add(discoveryKey);
            }

            if (created) {
              resultCount += 1;
            }
          }
        } catch (error) {
          if (isCreditLimitError(error)) {
            status = "partial";
            message = `${queryCount} of ${plannedQueryCount} queries completed, credit limit reached.`;
            break;
          }

          throw error;
        }
      }

      if (status === "partial") {
        break;
      }
    }
  } catch (error) {
    status = "failed";
    message =
      error instanceof Error
        ? error.message
        : "Search run failed before completion.";
  }

  const { error: updateError } = await supabase
    .from("search_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      query_count: queryCount,
      result_count: resultCount,
      credits_spent_est: creditsSpentEst
    })
    .eq("id", runId);

  if (updateError) {
    throw updateError;
  }

  return {
    runId,
    status,
    queryCount,
    plannedQueryCount,
    resultCount,
    creditsSpentEst,
    message
  };
}
