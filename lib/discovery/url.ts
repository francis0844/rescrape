export type SiteIdentity = {
  siteUrl: string;
  domain: string;
};

export function toSiteIdentity(rawUrl: string): SiteIdentity | null {
  try {
    const parsed = new URL(rawUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (!domain) {
      return null;
    }

    return {
      siteUrl: `https://${domain}`,
      domain
    };
  } catch {
    return null;
  }
}
