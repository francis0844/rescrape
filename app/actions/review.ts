"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";
import { rescanSource as rescanSourceWorker } from "@/lib/verification/scan-worker";

function requireDatabase() {
  if (!hasSupabaseServiceEnv()) {
    redirect(
      "/sources/review?message=Supabase environment variables are required to review sources."
    );
  }
}

/** Only a human click may set the terminal approved/rejected states. */
export async function approveSource(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/sources/review?message=Source id is required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("sources").update({ status: "approved" }).eq("id", id);

  if (error) {
    redirect(`/sources/review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review");
  revalidatePath("/dashboard");
  redirect("/sources/review?view=review&message=Source approved.");
}

export async function rejectSource(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/sources/review?message=Source id is required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("sources").update({ status: "rejected" }).eq("id", id);

  if (error) {
    redirect(`/sources/review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review");
  revalidatePath("/dashboard");
  redirect("/sources/review?view=review&message=Source rejected.");
}

export async function saveSourceNote(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("human_note") ?? "").trim();

  if (!id) {
    redirect("/sources/review?message=Source id is required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("sources")
    .update({ human_note: note || null })
    .eq("id", id);

  if (error) {
    redirect(`/sources/review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/sources/review");
  revalidatePath("/dashboard");
  redirect("/sources/review?view=review&message=Note saved.");
}

export async function rescanSourceAction(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/sources/review?message=Source id is required.");
  }

  await rescanSourceWorker(id);

  revalidatePath("/sources/review");
  revalidatePath("/dashboard");
  redirect("/sources/review?view=review&message=Source re-scanned.");
}

export type BulkActionResult = {
  updated: number;
};

/** Bulk approve/reject: still one status write per selected id, still human-triggered. */
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

  revalidatePath("/sources/review");
  revalidatePath("/dashboard");

  return { updated: ids.length };
}
