import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;

  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in");
    }

    email = user.email ?? null;
  }

  return <AppShell email={email}>{children}</AppShell>;
}
