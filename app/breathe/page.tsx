import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BreathingApp } from "@/components/BreathingApp";
import type { NoteRow, PreferencesRow, SessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Breathing exercise | Breathe" };

export default async function BreathePage() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect("/login");

  // Both scoped to this user by RLS rather than by these filters.
  const [{ data: preferences }, { data: recent }, { data: notes }] = await Promise.all([
    supabase.from("preferences").select("*").eq("user_id", user.id).single(),
    supabase
      .from("sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(8),
    supabase.from("notes").select("*").order("created_at", { ascending: false }),
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
      userId={user.id}
      notes={(notes as NoteRow[]) ?? []}
      preferences={(preferences as PreferencesRow) ?? fallback}
      recent={(recent as SessionRow[]) ?? []}
    />
  );
}
