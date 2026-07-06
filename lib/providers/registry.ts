import "server-only";

import { OpenAIVerificationAgent } from "@/lib/providers/openai-verification-agent";
import type { SearchProvider } from "@/lib/providers/search-provider";
import { TavilySearchProvider } from "@/lib/providers/tavily-search-provider";
import type { VerificationAgent } from "@/lib/providers/verification-agent";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";

type SearchProviderRow = {
  id: string;
  name: string;
  api_key_env: string;
  default_result_cap: number;
};

export async function getEnabledSearchProviders(): Promise<SearchProvider[]> {
  if (!hasSupabaseServiceEnv()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("search_providers")
    .select("id, name, api_key_env, default_result_cap")
    .eq("enabled", true);

  if (error) {
    throw error;
  }

  return ((data ?? []) as SearchProviderRow[]).map((provider) => {
    if (provider.name.toLowerCase() === "tavily") {
      return new TavilySearchProvider({
        id: provider.id,
        name: provider.name,
        apiKeyEnv: provider.api_key_env,
        defaultResultCap: provider.default_result_cap
      });
    }

    throw new Error(`Enabled search provider is not registered: ${provider.name}`);
  });
}

export function getVerificationAgent(): VerificationAgent {
  return new OpenAIVerificationAgent();
}
