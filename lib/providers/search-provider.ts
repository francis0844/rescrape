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

export interface SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultResultCap: number;
  search(request: SearchRequest): Promise<SearchResponse>;
}
