import { UserPlus } from "lucide-react";
import Link from "next/link";

import { signUp } from "@/app/actions/auth";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="sign-up-title">
        <div className="page-header">
          <UserPlus size={22} aria-hidden="true" />
          <h1 className="page-title" id="sign-up-title">
            Create account
          </h1>
          <p className="page-kicker">
            Set an email and password to get into ReScrape.
          </p>
        </div>

        <form className="auth-form" action={signUp}>
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span className="label">Email</span>
            <input className="input" name="email" type="email" required />
          </label>
          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </label>
          <label className="field">
            <span className="label">Confirm password</span>
            <input
              className="input"
              name="confirm_password"
              type="password"
              minLength={8}
              required
            />
          </label>
          {params.error ? (
            <p className="form-message" role="alert">
              {params.error}
            </p>
          ) : null}
          <button className="button" type="submit">
            Create account
          </button>
        </form>

        <p className="auth-footer-link">
          Already have an account? <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>.
        </p>
      </section>
    </main>
  );
}
