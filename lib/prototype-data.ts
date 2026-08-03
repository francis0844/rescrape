export const prototypeSchema = [
  { field: "Full name", key: "full_name", type: "Text", required: true, description: "Name of the deceased exactly as published" },
  { field: "Date of birth", key: "date_of_birth", type: "Date", required: false, description: "Birth date when explicitly stated by the source" },
  { field: "Date of death", key: "date_of_death", type: "Date", required: true, description: "Death date stated in the obituary" },
  { field: "Published date", key: "published_date", type: "Date", required: true, description: "Date the obituary was published" },
  { field: "Location", key: "location", type: "Text", required: true, description: "Most specific Nebraska location tied to the record" },
  { field: "Funeral home", key: "funeral_home", type: "Text", required: false, description: "Funeral home or memorial provider named by the source" },
  { field: "Obituary summary", key: "obituary_summary", type: "Long text", required: true, description: "Concise factual summary grounded in the obituary" },
  { field: "Source URL", key: "source_url", type: "URL", required: true, description: "Canonical obituary page" },
  { field: "Source evidence", key: "source_evidence", type: "Text", required: true, description: "Supporting passage retained for human review" }
];

export const prototypeRecords = [
  {
    id: "OBI-1048",
    status: "Needs review",
    title: "Margaret Elaine Carter",
    born: "March 4, 1944",
    died: "May 14, 2026",
    published: "May 18, 2026",
    location: "Omaha, Nebraska",
    funeralHome: "Prairie Hill Memorial",
    source: "prairiehill.example",
    sourcePath: "/obituaries/margaret-elaine-carter",
    confidence: "82%",
    summary: "Omaha resident remembered for her work with neighborhood literacy programs.",
    evidence: "Margaret Elaine Carter, 82, of Omaha, Nebraska, died on May 14, 2026. Services are under the care of Prairie Hill Memorial."
  },
  {
    id: "OBI-1047",
    status: "Verified",
    title: "Thomas Reed Lawson",
    born: "September 18, 1938",
    died: "May 12, 2026",
    published: "May 16, 2026",
    location: "Lincoln, Nebraska",
    funeralHome: "Oak Creek Funeral Home",
    source: "oakcreek.example",
    sourcePath: "/memorials/thomas-reed-lawson",
    confidence: "96%",
    summary: "Retired educator and longtime Lincoln resident survived by three children.",
    evidence: "Thomas Reed Lawson of Lincoln passed away on May 12, 2026, at age 87. Oak Creek Funeral Home will host the memorial service."
  },
  {
    id: "OBI-1046",
    status: "Verified",
    title: "Evelyn Marie Brooks",
    born: "January 27, 1951",
    died: "May 11, 2026",
    published: "May 15, 2026",
    location: "Grand Island, Nebraska",
    funeralHome: "Heartland Remembrance Center",
    source: "heartlandremembrance.example",
    sourcePath: "/notices/evelyn-marie-brooks",
    confidence: "94%",
    summary: "Grand Island resident whose obituary notes decades of community volunteer service.",
    evidence: "Evelyn Marie Brooks, 75, of Grand Island, died May 11, 2026. Arrangements were announced by Heartland Remembrance Center."
  },
  {
    id: "OBI-1045",
    status: "Needs review",
    title: "Daniel Joseph Kim",
    born: "Not stated",
    died: "May 10, 2026",
    published: "May 14, 2026",
    location: "Bellevue, Nebraska",
    funeralHome: "Not stated",
    source: "metro-notices.example",
    sourcePath: "/obituary/daniel-joseph-kim",
    confidence: "74%",
    summary: "Bellevue resident remembered by family and colleagues; service provider not stated.",
    evidence: "Daniel Joseph Kim of Bellevue died on May 10, 2026. The family will announce memorial arrangements at a later date."
  },
  {
    id: "OBI-1044",
    status: "Verified",
    title: "Patricia Ann Monroe",
    born: "June 9, 1947",
    died: "May 9, 2026",
    published: "May 13, 2026",
    location: "Kearney, Nebraska",
    funeralHome: "Platte Valley Memorial",
    source: "plattevalley.example",
    sourcePath: "/obituaries/patricia-ann-monroe",
    confidence: "98%",
    summary: "Kearney resident and former small-business owner remembered by her extended family.",
    evidence: "Patricia Ann Monroe, 78, of Kearney, passed away May 9, 2026. Platte Valley Memorial is assisting the family."
  }
];

export const prototypeDestinations = [
  { name: "CSV archive", detail: "Manual download", status: "Ready" },
  { name: "Email digest", detail: "Daily at 08:00", status: "Configured" },
  { name: "Telegram channel", detail: "New verified obituaries", status: "Draft" },
  { name: "Webhook", detail: "POST to external app", status: "Not configured" },
  { name: "Google Sheets", detail: "Append new rows", status: "Not configured" }
];

export const prototypeDeliveries = [
  { id: "DEL-0042", destination: "CSV archive", records: "1,248", state: "Ready to export", time: "May 19, 2026 · 09:15" },
  { id: "DEL-0041", destination: "Email digest", records: "186", state: "Preview only", time: "May 18, 2026 · 08:00" },
  { id: "DEL-0040", destination: "Telegram channel", records: "24", state: "Preview only", time: "May 17, 2026 · 14:30" }
];
