import { createBrowserClient } from "@supabase/ssr";

/** Supabase in the browser. Safe: the anon key is public by design, and RLS
 *  is what actually protects the data. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
