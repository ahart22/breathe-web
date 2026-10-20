"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlowButton } from "./GlowButton";

/** Turns Supabase's wording into something a person can act on. */
function readable(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("failed to fetch") || text.includes("networkerror")) {
    return "Could not reach the server. Check your connection, or reload the page if it has been open a while.";
  }
  if (text.includes("email not confirmed")) {
    return "This account still needs confirming. Check your inbox, or send the email again below.";
  }
  if (text.includes("invalid login credentials")) {
    return "That email and password do not match an account.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "There is already an account with that email. Try signing in instead.";
  }
  if (text.includes("password should be")) {
    return "Use a password of at least 8 characters.";
  }
  return message;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Shown when an account exists but has not been confirmed. */
  const [needsConfirming, setNeedsConfirming] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    setNeedsConfirming(false);

    const supabase = createClient();
    const credentials = { email: email.trim(), password };

    const { data, error: failure } =
      mode === "signup"
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

    if (failure) {
      setError(readable(failure.message));
      if (failure.message.toLowerCase().includes("email not confirmed")) {
        setNeedsConfirming(true);
      }
      setBusy(false);
      return;
    }

    // With confirmation switched on, sign-up returns a user but no session.
    if (mode === "signup" && data.user && !data.session) {
      setNotice("Account created. Confirm it from the email we just sent, then sign in.");
      setNeedsConfirming(true);
      setMode("signin");
      setBusy(false);
      return;
    }

    router.refresh();
  }

  async function resend() {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: failure } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    setError(failure ? readable(failure.message) : null);
    setNotice(failure ? null : "Sent. Check your inbox, and your spam folder.");
    setBusy(false);
  }

  return (
    <form className="auth" onSubmit={submit}>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <p className="error" style={notice && !error ? { color: "var(--green)" } : undefined}>
        {error ?? notice ?? " "}
      </p>

      <div style={{ textAlign: "center" }}>
        <GlowButton type="submit" disabled={busy}>
          {busy ? "One moment" : mode === "signup" ? "Create account" : "Sign in"}
        </GlowButton>
      </div>

      {needsConfirming && (
        <button type="button" className="swap" onClick={resend} disabled={busy}>
          Send the confirmation email again
        </button>
      )}

      <button
        type="button"
        className="swap"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setNotice(null);
        }}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Create one"}
      </button>
    </form>
  );
}
