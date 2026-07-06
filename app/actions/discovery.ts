"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { runDiscoverySearch } from "@/lib/discovery/run-search";

export async function runSearch() {
  const result = await runDiscoverySearch();
  revalidatePath("/sources");

  const params = new URLSearchParams({
    message: result.message
  });

  if (result.runId) {
    params.set("runId", result.runId);
  }

  redirect(`/sources?${params.toString()}`);
}
