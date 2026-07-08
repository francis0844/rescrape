"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { runDiscoverySearch } from "@/lib/discovery/run-search";

export async function runSearch(formData: FormData) {
  const keywordIds = formData.getAll("keywordIds").map(String);
  const result = await runDiscoverySearch({ keywordIds });
  revalidatePath("/sources/search");
  revalidatePath("/sources/scan");
  revalidatePath("/dashboard");

  const params = new URLSearchParams({
    message: result.message
  });

  if (result.runId) {
    params.set("runId", result.runId);
  }

  redirect(`/sources/search?${params.toString()}`);
}
