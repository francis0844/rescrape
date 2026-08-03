export const prototypeSchema = [
  { field: "Record title", key: "title", type: "Text", required: true, description: "Primary name or title shown by the source" },
  { field: "Published date", key: "published_date", type: "Date", required: true, description: "Date the source published the record" },
  { field: "Location", key: "location", type: "Text", required: false, description: "Most specific place stated by the source" },
  { field: "Category", key: "category", type: "Text", required: false, description: "Source-defined record classification" },
  { field: "Summary", key: "summary", type: "Long text", required: true, description: "Concise factual summary grounded in evidence" },
  { field: "Source URL", key: "source_url", type: "URL", required: true, description: "Canonical page where the record was found" },
  { field: "Source evidence", key: "source_evidence", type: "Text", required: true, description: "Verbatim supporting passage retained for review" }
];

export const prototypeRecords = [
  {
    id: "REC-1048",
    status: "Needs review",
    title: "Regional program update",
    published: "May 18, 2026",
    location: "Northern region",
    category: "Program update",
    source: "atlas-example.org",
    confidence: "82%",
    evidence: "The regional program expanded its operating area and published an updated service schedule for participating communities."
  },
  {
    id: "REC-1047",
    status: "Verified",
    title: "Quarterly directory release",
    published: "May 18, 2026",
    location: "Multiple locations",
    category: "Directory",
    source: "northstar-example.net",
    confidence: "96%",
    evidence: "The organization released its quarterly directory with revised contact and location information."
  },
  {
    id: "REC-1046",
    status: "Verified",
    title: "Public dataset revision",
    published: "May 17, 2026",
    location: "Global",
    category: "Dataset",
    source: "data-example.org",
    confidence: "94%",
    evidence: "Version 4.2 adds newly validated entries and corrects location fields in the previous release."
  },
  {
    id: "REC-1045",
    status: "Needs review",
    title: "Local office announcement",
    published: "May 16, 2026",
    location: "Central district",
    category: "Announcement",
    source: "civic-example.org",
    confidence: "74%",
    evidence: "A new local office is expected to begin public operations after the final review period."
  },
  {
    id: "REC-1044",
    status: "Verified",
    title: "Annual report publication",
    published: "May 15, 2026",
    location: "Western region",
    category: "Report",
    source: "archive-example.com",
    confidence: "98%",
    evidence: "The annual report contains final operating totals, regional summaries, and source citations for the reporting period."
  }
];

export const prototypeDestinations = [
  { name: "CSV archive", detail: "Manual download", status: "Ready" },
  { name: "Email digest", detail: "Daily at 08:00", status: "Configured" },
  { name: "Telegram channel", detail: "New verified records", status: "Draft" },
  { name: "Webhook", detail: "POST to external app", status: "Not configured" },
  { name: "Google Sheets", detail: "Append new rows", status: "Not configured" }
];

export const prototypeDeliveries = [
  { id: "DEL-0042", destination: "CSV archive", records: "1,248", state: "Ready to export", time: "May 19, 2026 · 09:15" },
  { id: "DEL-0041", destination: "Email digest", records: "186", state: "Preview only", time: "May 18, 2026 · 08:00" },
  { id: "DEL-0040", destination: "Telegram channel", records: "24", state: "Preview only", time: "May 17, 2026 · 14:30" }
];
