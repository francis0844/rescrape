const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " "
};

export function extractText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withoutTags = withoutNoise.replace(/<[^>]+>/g, " ");
  const decoded = withoutTags.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g,
    (match) => ENTITY_MAP[match] ?? match
  );

  return decoded.replace(/\s+/g, " ").trim();
}

export function extractSameOriginLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const links = new Set<string>();
  const hrefPattern = /<a\s+[^>]*href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html))) {
    try {
      const resolved = new URL(match[1], base);

      if (!["http:", "https:"].includes(resolved.protocol)) {
        continue;
      }

      if (resolved.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) {
        continue;
      }

      resolved.hash = "";
      links.add(resolved.toString());
    } catch {
      // Ignore malformed hrefs.
    }
  }

  return [...links];
}
