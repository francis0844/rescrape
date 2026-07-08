import { NextResponse } from "next/server";

import { buildSourcesCsv } from "@/lib/export/sources-csv";

export async function GET() {
  const csv = await buildSourcesCsv();
  const filename = `rescrape-sources-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
