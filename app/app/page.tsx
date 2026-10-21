import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Reflections } from "@/components/Reflections";
import type { NoteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your space | Breathe" };

export default async function AppPage() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Signed out, this page has nothing to show and no business rendering.
  if (!user) redirect("/login");

  // No user_id filter needed: RLS already restricts this to the caller's own
  // rows. The filter would be belt and braces, not the protection itself.
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="workspace" data-testid="app-page">
      <header className="workspace-head">
        <Link href="/app" className="gradient-text workspace-brand">
          Breathe
        </Link>
        <div className="workspace-right">
          <span className="muted workspace-email" data-testid="current-email">
            {user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="ghost" data-testid="logout">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="workspace-main">
        <section className="panel-card breathe-card">
          <h2 className="card-title">Take three minutes</h2>
          <p className="muted card-sub">
            Four seconds in, two held, six out, paced by the animation.
          </p>
          <Link href="/breathe" className="cta" data-testid="start-breathing">
            Start breathing exercise
          </Link>
        </section>

        <Reflections userId={user.id} initial={(notes as NoteRow[]) ?? []} />
      </main>
    </div>
  );
}
