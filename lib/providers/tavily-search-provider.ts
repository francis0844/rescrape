import { NotImplementedError } from "@/lib/errors";
import type {
  SearchProvider,
  SearchRequest,
  SearchResult
} from "@/lib/providers/search-provider";

type TavilySearchProviderOptions = {
  id: string;
  name: string;
  apiKeyEnv: string;
  defaultResultCap: number;
};

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

  async search(request: SearchRequest): Promise<SearchResult[]> {
    void request;
    throw new NotImplementedError(
      "Tavily search is intentionally stubbed during Phase 0."
    );
  }
}
