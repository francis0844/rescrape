"use server";

import { revalidatePath } from "next/cache";

import { ensureScanJob, getScanJob, runScanChunk } from "@/lib/verification/scan-worker";

export async function startScan() {
  const job = await ensureScanJob();
  revalidatePath("/sources");
  return job;
}

export async function tickScan(jobId: string) {
  const result = await runScanChunk(jobId);
  revalidatePath("/sources");
  return result;
}

export async function fetchScanJob(jobId: string) {
  return getScanJob(jobId);
}
