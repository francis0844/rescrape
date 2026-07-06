const placeholderUrl = "https://placeholder.supabase.co";
const placeholderKey = "placeholder-key";

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? placeholderUrl,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? placeholderKey
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
