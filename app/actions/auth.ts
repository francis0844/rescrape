"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(next: string) {
  return next.startsWith("/") ? next : "/dashboard";
}

async function requestOrigin() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? "/dashboard"));
  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error || !data.url) {
    redirect(
      `/auth/sign-in?error=${encodeURIComponent(error?.message ?? "Could not start Google sign-in.")}`
    );
  }

  redirect(data.url);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/dashboard"));

  if (!email || !password) {
    redirect("/auth/sign-up?error=Email and password are required.");
  }

  if (password.length < 8) {
    redirect("/auth/sign-up?error=Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    redirect("/auth/sign-up?error=Passwords do not match.");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error) {
    redirect(`/auth/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // Existing, already-confirmed accounts come back with an empty identities array
  // instead of an error, so re-signing up doesn't leak whether the email exists.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    redirect("/auth/sign-in?message=An account with that email already exists. Sign in instead.");
  }

  if (data.session) {
    redirect(next);
  }

  redirect(
    "/auth/sign-in?message=Account created. Check your email to confirm before signing in."
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
