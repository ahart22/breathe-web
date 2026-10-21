import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The landing page. Deliberately readable without an account: a visitor has
 *  to be able to tell what this is, who it is for and what to press before
 *  being asked for an email address. */
export default async function Landing() {
  const supabase = await createClient();

  // A misconfigured backend shows the landing page rather than a stack trace.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (user) redirect("/app");

  return (
    <main className="landing" data-testid="landing">
      <h1 className="gradient-text landing-title" data-testid="landing-title">
        Breathe
      </h1>

      <p className="landing-lead" data-testid="landing-subtitle">
        Guided breathing exercises for students to help with stress
      </p>

      <p className="landing-sub">
        Three minutes of guided breathing between study blocks, then one line
        on how it went. Your reflections save to your account and are visible
        only to you.
      </p>

      <Link href="/signup" className="cta" data-testid="cta-signup">
        Get started &mdash; it&rsquo;s free
      </Link>

      <p className="landing-alt">
        Already have an account?{" "}
        <Link href="/login" data-testid="link-login">
          Log in
        </Link>
      </p>

      <ul className="landing-points">
        <li>
          <strong>Breathe for three minutes.</strong> Four seconds in, two held,
          six out, paced by an animation so there is nothing to count.
        </li>
        <li>
          <strong>Write one line about how you feel.</strong> Saved to your
          account, so you can look back at it later.
        </li>
        <li>
          <strong>Private by default.</strong> Enforced by the database, not
          just the app &mdash; nobody else can read your entries.
        </li>
      </ul>
    </main>
  );
}
