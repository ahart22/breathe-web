import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthPanel } from "@/components/AuthPanel";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign up | Breathe" };

export default async function SignUpPage() {
  const supabase = await createClient();
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/app");
  } catch {
    // Unreachable backend: still show the form rather than a crash.
  }
  return <AuthPanel mode="signup" />;
}
