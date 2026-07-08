import "server-only";

import { getAllSourcesForExport, getDiscoveryInfoForSources } from "@/lib/app-data";
import { statusLabel } from "@/lib/status-label";

const COLUMNS = [
  "site_url",
  "domain",
  "title",
  "snippet",
  "status",
  "ai_verdict",
  "ai_confidence",
  "ai_reason",
  "extractable_fields",
  "sample_preview",
  "evidence_urls",
  "human_note",
  "keywords",
  "runs",
  "first_discovered_at",
  "last_scanned_at"
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = typeof value === "string" ? value : JSON.stringify(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/** Always exports every source, full search+scan+review data, regardless of any on-screen filter. */
export async function buildSourcesCsv(): Promise<string> {
  const sources = await getAllSourcesForExport();
  const discoveryInfo = await getDiscoveryInfoForSources(sources.map((source) => source.id));

  const rows = sources.map((source) => {
    const discovery = discoveryInfo[source.id];

    const record: Record<(typeof COLUMNS)[number], string> = {
      site_url: source.site_url,
      domain: source.domain,
      title: source.title,
      snippet: source.snippet,
      status: statusLabel(source.status),
      ai_verdict: source.ai_verdict ?? "",
      ai_confidence: source.ai_confidence === null ? "" : String(source.ai_confidence),
      ai_reason: source.ai_reason ?? "",
      extractable_fields: (source.extractable_fields ?? []).join("; "),
      sample_preview: source.sample_preview ? JSON.stringify(source.sample_preview) : "",
      evidence_urls: (source.evidence_urls ?? []).join("; "),
      human_note: source.human_note ?? "",
      keywords: (discovery?.keywords ?? []).map((keyword) => keyword.label).join("; "),
      runs: (discovery?.runs ?? []).map((run) => run.label).join("; "),
      first_discovered_at: source.first_discovered_at,
      last_scanned_at: source.last_scanned_at ?? ""
    };

    return COLUMNS.map((column) => csvEscape(record[column])).join(",");
  });

  return [COLUMNS.join(","), ...rows].join("\r\n");
}
