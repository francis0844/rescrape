"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasSupabaseServiceEnv } from "@/lib/supabase/service-env";

function requireDatabase() {
  if (!hasSupabaseServiceEnv()) {
    redirect("/settings?message=Supabase environment variables are required to save settings.");
  }
}

function parsePositiveInt(value: FormDataEntryValue | null, field: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a whole number greater than 0.`);
  }

  return parsed;
}

function parseConfig(value: string) {
  try {
    const parsed = JSON.parse(value || "{}");

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Provider config must be a JSON object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Provider config must be valid JSON.");
  }
}

function parseDomains(value: string) {
  return value
    .split(/[\n,]/)
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export async function updateSearchProvider(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");
  const apiKeyEnv = String(formData.get("api_key_env") ?? "").trim();

  if (!id) {
    throw new Error("Provider id is required.");
  }

  if (!/^[A-Z0-9_]+$/.test(apiKeyEnv)) {
    throw new Error("API key reference must be an environment variable name.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("search_providers")
    .update({
      enabled: formData.get("enabled") === "on",
      api_key_env: apiKeyEnv,
      default_result_cap: parsePositiveInt(
        formData.get("default_result_cap"),
        "Default result cap"
      ),
      config: parseConfig(String(formData.get("config") ?? "{}"))
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath("/settings");
  redirect("/settings?message=Provider whitelist saved.");
}

export async function updateAppSettings(formData: FormData) {
  requireDatabase();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Settings id is required.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      result_cap_per_query: parsePositiveInt(
        formData.get("result_cap_per_query"),
        "Result cap per query"
      ),
      crawl_max_pages: parsePositiveInt(
        formData.get("crawl_max_pages"),
        "Crawl max pages"
      ),
      crawl_max_depth: parsePositiveInt(
        formData.get("crawl_max_depth"),
        "Crawl max depth"
      ),
      crawl_char_budget: parsePositiveInt(
        formData.get("crawl_char_budget"),
        "Crawl character budget"
      ),
      chunk_size: parsePositiveInt(formData.get("chunk_size"), "Chunk size"),
      include_domains: parseDomains(String(formData.get("include_domains") ?? ""))
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath("/settings");
  redirect("/settings?message=Budget and crawl settings saved.");
}
