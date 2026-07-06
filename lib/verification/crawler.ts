import "server-only";

import type { SearchProvider } from "@/lib/providers/search-provider";
import { extractSameOriginLinks, extractText } from "@/lib/verification/html";
import { isCrawlAllowed } from "@/lib/verification/robots";

export type CrawlPage = {
  url: string;
  text: string;
};

export type CrawlOutcome =
  | { kind: "blocked" }
  | { kind: "empty"; message: string }
  | { kind: "ok"; pages: CrawlPage[]; combinedText: string; usedExtractFallback: boolean };

type CrawlOptions = {
  siteUrl: string;
  maxPages: number;
  maxDepth: number;
  charBudget: number;
  extractProvider: SearchProvider | null;
  onStep?: (step: string) => Promise<void>;
};

const FETCH_TIMEOUT_MS = 8000;
const FETCH_ATTEMPTS = 2;

async function fetchOnce(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ReScrapeVerificationAgent",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("html") && !contentType.includes("text")) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt += 1) {
    const html = await fetchOnce(url);

    if (html !== null) {
      return html;
    }
  }

  return null;
}

export async function crawlSite(options: CrawlOptions): Promise<CrawlOutcome> {
  const { siteUrl, maxPages, maxDepth, charBudget, extractProvider, onStep } = options;

  await onStep?.("fetching");

  const rootAllowed = await isCrawlAllowed(siteUrl, "/");

  if (!rootAllowed) {
    return { kind: "blocked" };
  }

  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: siteUrl, depth: 0 }];
  const pages: CrawlPage[] = [];
  let totalChars = 0;
  let rootFetchFailed = false;

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift();

    if (!next || visited.has(next.url)) {
      continue;
    }

    visited.add(next.url);

    if (next.depth > 0) {
      const path = new URL(next.url).pathname || "/";
      const allowed = await isCrawlAllowed(siteUrl, path);

      if (!allowed) {
        continue;
      }
    }

    await onStep?.(`crawling ${pages.length + 1}/${maxPages}`);

    const html = await fetchWithRetry(next.url);

    if (html === null) {
      if (next.url === siteUrl) {
        rootFetchFailed = true;
      }

      continue;
    }

    const text = extractText(html);

    if (text) {
      pages.push({ url: next.url, text });
      totalChars += text.length;
    }

    if (totalChars >= charBudget) {
      break;
    }

    if (next.depth < maxDepth) {
      for (const link of extractSameOriginLinks(html, next.url)) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: next.depth + 1 });
        }
      }
    }
  }

  if (pages.length > 0) {
    return {
      kind: "ok",
      pages,
      combinedText: pages
        .map((page) => page.text)
        .join("\n\n")
        .slice(0, charBudget),
      usedExtractFallback: false
    };
  }

  if (extractProvider) {
    await onStep?.("fetching (fallback)");

    try {
      const fallback = await extractProvider.extract({ url: siteUrl });

      if (fallback.success && fallback.text) {
        return {
          kind: "ok",
          pages: [{ url: siteUrl, text: fallback.text }],
          combinedText: fallback.text.slice(0, charBudget),
          usedExtractFallback: true
        };
      }
    } catch {
      // Fall through to the empty outcome below.
    }
  }

  return {
    kind: "empty",
    message: rootFetchFailed
      ? "Site did not respond after retries."
      : "No extractable content found (JS-heavy or empty page)."
  };
}
