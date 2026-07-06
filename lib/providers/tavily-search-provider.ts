import { NotImplementedError } from "@/lib/errors";
import type {
  SearchProvider,
  SearchRequest,
  SearchResponse
} from "@/lib/providers/search-provider";

type TavilySearchProviderOptions = {
  id: string;
  name: string;
  apiKeyEnv: string;
  defaultResultCap: number;
};

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilySearchResponse = {
  results?: TavilySearchResult[];
  usage?: {
    credits?: number;
  };
};

export class TavilySearchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TavilySearchError";
    this.status = status;
  }
}

export class TavilySearchProvider implements SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly apiKeyEnv: string;
  readonly defaultResultCap: number;

  constructor(options: TavilySearchProviderOptions) {
    this.id = options.id;
    this.name = options.name;
    this.apiKeyEnv = options.apiKeyEnv;
    this.defaultResultCap = options.defaultResultCap;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const apiKey = process.env[this.apiKeyEnv];

    if (!apiKey) {
      throw new NotImplementedError(
        `${this.apiKeyEnv} is required before Tavily search can run.`
      );
    }

    const maxResults = Math.min(Math.max(request.resultCap, 1), 20);
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: request.query,
        search_depth: "basic",
        max_results: maxResults,
        include_domains: request.includeDomains,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        include_favicon: false,
        include_usage: true
      })
    });

    if (!response.ok) {
      let message = `Tavily search failed with status ${response.status}.`;

      try {
        const payload = (await response.json()) as { detail?: string; error?: string };
        message = payload.detail ?? payload.error ?? message;
      } catch {
        // Preserve the status-based message when the response is not JSON.
      }

      throw new TavilySearchError(response.status, message);
    }

    const payload = (await response.json()) as TavilySearchResponse;

    return {
      results: (payload.results ?? [])
        .filter((result) => result.url)
        .map((result) => ({
          title: result.title?.trim() || "Untitled source",
          url: result.url ?? "",
          snippet: result.content?.trim() || ""
        })),
      creditsSpent: payload.usage?.credits ?? 1
    };
  }
}
