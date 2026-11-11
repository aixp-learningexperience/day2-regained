import { createClient } from "@supabase/supabase-js";

// Public (publishable) credentials of the event backend. Safe to ship in the browser:
// every table is protected by row-level security and all writes go through RPCs.
const SUPABASE_URL = "https://c--c56db031-0f24-4ffa-b71d-6d0cac7b76e5-prod.lovable.cloud";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BJ0mQay3titbFhEVxpLd_Q_T8fl5Ozs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
