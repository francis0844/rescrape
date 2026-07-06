export type SearchRequest = {
  query: string;
  resultCap: number;
  includeDomains: string[];
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type SearchResponse = {
  results: SearchResult[];
  creditsSpent: number;
};

export type ExtractRequest = {
  url: string;
};

export type ExtractResponse = {
  text: string;
  success: boolean;
};

export interface SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultResultCap: number;
  search(request: SearchRequest): Promise<SearchResponse>;
  extract(request: ExtractRequest): Promise<ExtractResponse>;
}
