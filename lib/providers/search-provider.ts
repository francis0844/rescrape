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

export interface SearchProvider {
  readonly id: string;
  readonly name: string;
  search(request: SearchRequest): Promise<SearchResult[]>;
}
