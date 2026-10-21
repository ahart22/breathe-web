import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthPanel } from "@/components/AuthPanel";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign up | Breathe" };

export default async function SignUpPage() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Unreachable backend: still show the form rather than a crash.
    user = null;
  }

  // Outside the try on purpose: redirect() works by throwing, so a catch
  // around it would swallow the redirect.
  if (user) redirect("/app");

  return <AuthPanel mode="signup" />;
}
