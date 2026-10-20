"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlowButton } from "./GlowButton";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const credentials = { email: email.trim(), password };

    const { data, error: failure } =
      mode === "signup"
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

    if (failure) {
      setError(failure.message);
      setBusy(false);
      return;
    }

    // With email confirmation switched on, sign-up returns a user but no
    // session — they have to click the link first.
    if (mode === "signup" && data.user && !data.session) {
      setNotice("Check your email to confirm the account, then sign in.");
      setMode("signin");
      setBusy(false);
      return;
    }

    router.refresh();
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

      <p className="error">{error ?? notice ?? " "}</p>

      <div style={{ textAlign: "center" }}>
        <GlowButton type="submit" disabled={busy}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </GlowButton>
      </div>

      <button
        type="button"
        className="swap"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
        }}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Create one"}
      </button>
    </form>
  );
}
