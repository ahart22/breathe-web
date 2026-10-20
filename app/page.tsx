import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";
import { BreathingApp } from "@/components/BreathingApp";
import type { PreferencesRow, SessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  // If Supabase is unreachable or misconfigured, show the sign-in screen
  // rather than a stack trace. A visitor should never meet a crash because
  // a key is wrong.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <div className="shell">
        <div className="panel">
          <div className="panel-body">
            <h1 className="gradient-text" style={{ fontSize: 46, margin: 0 }}>
              Breathe
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 17 }}>
              Helping students with stress
            </p>
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  // Both queries are scoped to this user by RLS, not by these filters — the
  // database would refuse to return anyone else's rows either way.
  const [{ data: preferences }, { data: recent }] = await Promise.all([
    supabase.from("preferences").select("*").eq("user_id", user.id).single(),
    supabase
      .from("sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const fallback: PreferencesRow = {
    user_id: user.id,
    minutes: 3,
    reminders_on: false,
    interval_minutes: 45,
    updated_at: new Date().toISOString(),
  };

  return (
    <BreathingApp
      email={user.email ?? ""}
      preferences={(preferences as PreferencesRow) ?? fallback}
      recent={(recent as SessionRow[]) ?? []}
    />
  );
}
