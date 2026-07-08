"use server";

import { revalidatePath } from "next/cache";

import { ensureScanJob, getScanJob, runScanChunk } from "@/lib/verification/scan-worker";

export async function startScan(keywordIds?: string[]) {
  const job = await ensureScanJob(keywordIds);
  revalidatePath("/sources/scan");
  return job;
}

export async function tickScan(jobId: string) {
  const result = await runScanChunk(jobId);
  revalidatePath("/sources/scan");
  revalidatePath("/sources/review");
  revalidatePath("/dashboard");
  return result;
}

export async function fetchScanJob(jobId: string) {
  return getScanJob(jobId);
}
