import "server-only";

const placeholderUrl = "https://placeholder.supabase.co";
const placeholderKey = "placeholder-service-role-key";

export function getSupabaseServiceEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? placeholderUrl,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? placeholderKey
  };
}
