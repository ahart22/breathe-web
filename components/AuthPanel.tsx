"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Turns Supabase's wording into something a person can act on. */
function readable(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("failed to fetch") || text.includes("networkerror")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (text.includes("email not confirmed")) {
    return "This account still needs confirming. Check your inbox.";
  }
  if (text.includes("invalid login credentials")) {
    return "That email and password do not match an account.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "There is already an account with that email. Log in instead.";
  }
  if (text.includes("password should be")) {
    return "Use a password of at least 8 characters.";
  }
  return message;
}

export function AuthPanel({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signingUp = mode === "signup";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const credentials = { email: email.trim(), password };

    const { data, error: failure } = signingUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    if (failure) {
      setError(readable(failure.message));
      setBusy(false);
      return;
    }

    // With email confirmation switched on, sign-up returns a user but no
    // session, so there is nothing to land on yet.
    if (signingUp && data.user && !data.session) {
      setNotice("Account created. Confirm it from the email we sent, then log in.");
      setBusy(false);
      return;
    }

    // replace(), not push(), so Back does not return to a form the visitor
    // has already submitted.
    router.replace("/app");
    router.refresh();
  }

  return (
    <main className="auth-page" data-testid={signingUp ? "signup-page" : "login-page"}>
      <div className="auth-card">
        <Link href="/" className="gradient-text auth-brand">
          Breathe
        </Link>

        <h1 className="auth-heading" data-testid="auth-heading">
          {signingUp ? "Create your account" : "Log in"}
        </h1>
        <p className="muted auth-sub">
          {signingUp
            ? "Email and password. Nothing else."
            : "Welcome back."}
        </p>

        <form className="auth" onSubmit={submit} data-testid="auth-form">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@university.edu"
            autoComplete="email"
            required
            data-testid="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete={signingUp ? "new-password" : "current-password"}
            required
            minLength={8}
            data-testid="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <p className="error" role="alert" data-testid="auth-error">
              {error}
            </p>
          )}
          {notice && !error && (
            <p className="notice" role="status" data-testid="auth-notice">
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="cta cta-block"
            disabled={busy}
            data-testid="submit"
          >
            {busy ? "One moment…" : signingUp ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="landing-alt">
          {signingUp ? (
            <>
              Already have an account?{" "}
              <Link href="/login" data-testid="link-login">
                Log in
              </Link>
            </>
          ) : (
            <>
              Need an account?{" "}
              <Link href="/signup" data-testid="link-signup">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
