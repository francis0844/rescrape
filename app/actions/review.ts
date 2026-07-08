"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";
import { rescanSource as rescanSourceWorker } from "@/lib/verification/scan-worker";

const DEFAULT_RETURN_PATH = "/sources/review";

function returnPath(formData: FormData) {
  const value = String(formData.get("returnTo") ?? "");
  return value.startsWith("/sources/review") ? value : DEFAULT_RETURN_PATH;
}

function requireDatabase() {
  if (!hasSupabaseServiceEnv()) {
    redirect(
      `${DEFAULT_RETURN_PATH}?message=Supabase environment variables are required to review sources.`
    );
  }
}

/** Only a human click may set the terminal approved/rejected states. */
export async function approveSource(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const back = returnPath(formData);

  if (!id) {
    redirect(`${back}?message=Source id is required.`);
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("sources").update({ status: "approved" }).eq("id", id);

  if (error) {
    redirect(`${back}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review", "layout");
  revalidatePath("/dashboard");
  redirect(`${back}?message=${encodeURIComponent("Source marked User Approved.")}`);
}

export async function rejectSource(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const back = returnPath(formData);

  if (!id) {
    redirect(`${back}?message=Source id is required.`);
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("sources").update({ status: "rejected" }).eq("id", id);

  if (error) {
    redirect(`${back}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review", "layout");
  revalidatePath("/dashboard");
  redirect(`${back}?message=${encodeURIComponent("Source marked User Rejected.")}`);
}

export async function saveSourceNote(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("human_note") ?? "").trim();
  const back = returnPath(formData);

  if (!id) {
    redirect(`${back}?message=Source id is required.`);
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("sources")
    .update({ human_note: note || null })
    .eq("id", id);

  if (error) {
    redirect(`${back}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review", "layout");
  redirect(`${back}?message=Note saved.`);
}

export async function rescanSourceAction(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const back = returnPath(formData);

  if (!id) {
    redirect(`${back}?message=Source id is required.`);
  }

  await rescanSourceWorker(id);

  revalidatePath("/sources/review", "layout");
  revalidatePath("/sources/scan", "layout");
  revalidatePath("/dashboard");
  redirect(`${back}?message=Source re-scanned.`);
}

export type BulkActionResult = {
  updated: number;
};

/** Bulk approve/reject: still one status write per selected id, still human-triggered.
 *  Only two statuses are ever assignable this way — approved (User Approved) or rejected (User Rejected). */
export async function bulkUpdateStatus(
  ids: string[],
  status: "approved" | "rejected"
): Promise<BulkActionResult> {
  if (!hasSupabaseServiceEnv() || !ids.length) {
    return { updated: 0 };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("sources").update({ status }).in("id", ids);

  if (error) {
    throw error;
  }

  revalidatePath("/sources/review", "layout");
  revalidatePath("/dashboard");

  return { updated: ids.length };
}
