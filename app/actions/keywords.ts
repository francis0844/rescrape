"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeKeywordKey, type KeywordRow } from "@/lib/app-data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";

const maxImportRows = 5000;

export type CsvImportRow = {
  topic?: string;
  location?: string;
  notes?: string;
  active?: string;
};

export type CsvImportResult = {
  added: number;
  skipped: number;
  rejected: number;
  messages: string[];
};

function requireDatabase(path = "/keywords") {
  if (!hasSupabaseServiceEnv()) {
    redirect(`${path}?message=Supabase environment variables are required to save keywords.`);
  }
}

function cleanOptional(value: FormDataEntryValue | null) {
  const cleaned = String(value ?? "").trim();
  return cleaned.length ? cleaned : null;
}

function parseActive(value: unknown) {
  if (typeof value !== "string") {
    return true;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return ["1", "true", "yes", "y", "active", "on"].includes(normalized);
}

export async function createKeyword(formData: FormData) {
  requireDatabase();

  const topic = String(formData.get("topic") ?? "").trim();

  if (!topic) {
    redirect("/keywords?message=Please enter a topic before creating a keyword.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("keywords").insert({
    topic,
    location: cleanOptional(formData.get("location")),
    notes: cleanOptional(formData.get("notes")),
    active: formData.get("active") !== null
  });

  if (error) {
    redirect(`/keywords?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/keywords");
  redirect("/keywords?message=Keyword created.");
}

export async function updateKeyword(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();

  if (!id || !topic) {
    redirect("/keywords?message=Keyword id and topic are required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("keywords")
    .update({
      topic,
      location: cleanOptional(formData.get("location")),
      notes: cleanOptional(formData.get("notes")),
      active: formData.get("active") !== null
    })
    .eq("id", id);

  if (error) {
    redirect(`/keywords?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/keywords");
  redirect("/keywords?message=Keyword saved.");
}

export async function deleteKeyword(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/keywords?message=Keyword id is required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("keywords").delete().eq("id", id);

  if (error) {
    redirect(`/keywords?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/keywords");
  redirect("/keywords?message=Keyword deleted.");
}

export async function importKeywords(input: {
  rows: CsvImportRow[];
  mode: "append" | "replace";
  confirmReplace: boolean;
}): Promise<CsvImportResult> {
  if (!hasSupabaseServiceEnv()) {
    return {
      added: 0,
      skipped: 0,
      rejected: input.rows.length,
      messages: ["Supabase environment variables are required to import keywords."]
    };
  }

  if (input.rows.length > maxImportRows) {
    return {
      added: 0,
      skipped: 0,
      rejected: input.rows.length,
      messages: [`Import is capped at ${maxImportRows} rows.`]
    };
  }

  if (input.mode === "replace" && !input.confirmReplace) {
    return {
      added: 0,
      skipped: 0,
      rejected: input.rows.length,
      messages: ["Replace all requires explicit confirmation."]
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  if (input.mode === "replace") {
    const { error } = await supabase
      .from("keywords")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw error;
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("keywords")
    .select("id, topic, location, notes, active, created_at, updated_at");

  if (existingError) {
    throw existingError;
  }

  const seen = new Set(
    ((existing ?? []) as KeywordRow[]).map((row) =>
      normalizeKeywordKey(row.topic, row.location)
    )
  );
  const rowsToInsert: Array<{
    topic: string;
    location: string | null;
    notes: string | null;
    active: boolean;
  }> = [];
  const messages: string[] = [];
  let skipped = 0;
  let rejected = 0;

  input.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const topic = (row.topic ?? "").trim();
    const location = (row.location ?? "").trim();
    const key = normalizeKeywordKey(topic, location);

    if (!topic) {
      rejected += 1;
      messages.push(`Row ${rowNumber}: empty topic.`);
      return;
    }

    if (seen.has(key)) {
      skipped += 1;
      messages.push(`Row ${rowNumber}: duplicate topic and location skipped.`);
      return;
    }

    seen.add(key);
    rowsToInsert.push({
      topic,
      location: location || null,
      notes: (row.notes ?? "").trim() || null,
      active: parseActive(row.active)
    });
  });

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("keywords").insert(rowsToInsert);

    if (error) {
      throw error;
    }
  }

  revalidatePath("/keywords");

  return {
    added: rowsToInsert.length,
    skipped,
    rejected,
    messages
  };
}
