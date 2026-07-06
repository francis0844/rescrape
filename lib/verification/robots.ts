import "server-only";

type RobotsGroup = {
  agents: string[];
  disallow: string[];
  allow: string[];
};

const USER_AGENT = "ReScrapeVerificationAgent";

function parseRobots(body: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();

    if (!line) {
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const field = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (field === "user-agent") {
      if (!current || current.disallow.length || current.allow.length) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }

      current.agents.push(value.toLowerCase());
    } else if (field === "disallow" && current) {
      if (value) {
        current.disallow.push(value);
      }
    } else if (field === "allow" && current) {
      if (value) {
        current.allow.push(value);
      }
    }
  }

  return groups;
}

function selectGroup(groups: RobotsGroup[]): RobotsGroup | null {
  const specific = groups.find((group) =>
    group.agents.some((agent) => agent === USER_AGENT.toLowerCase())
  );

  if (specific) {
    return specific;
  }

  return groups.find((group) => group.agents.includes("*")) ?? null;
}

/** Longest matching rule wins, per the de-facto robots.txt spec. */
function isPathAllowedByGroup(path: string, group: RobotsGroup): boolean {
  let bestMatch: { length: number; allowed: boolean } | null = null;

  for (const rule of group.disallow) {
    if (path.startsWith(rule) && (!bestMatch || rule.length > bestMatch.length)) {
      bestMatch = { length: rule.length, allowed: false };
    }
  }

  for (const rule of group.allow) {
    if (path.startsWith(rule) && (!bestMatch || rule.length > bestMatch.length)) {
      bestMatch = { length: rule.length, allowed: true };
    }
  }

  return bestMatch?.allowed ?? true;
}

const robotsCache = new Map<string, RobotsGroup[] | null>();

export async function isCrawlAllowed(siteUrl: string, path = "/"): Promise<boolean> {
  const origin = new URL(siteUrl).origin;

  if (!robotsCache.has(origin)) {
    try {
      const response = await fetch(new URL("/robots.txt", origin).toString(), {
        headers: { "User-Agent": USER_AGENT }
      });

      robotsCache.set(origin, response.ok ? parseRobots(await response.text()) : null);
    } catch {
      robotsCache.set(origin, null);
    }
  }

  const groups = robotsCache.get(origin);

  if (!groups || !groups.length) {
    return true;
  }

  const group = selectGroup(groups);

  if (!group) {
    return true;
  }

  return isPathAllowedByGroup(path, group);
}
