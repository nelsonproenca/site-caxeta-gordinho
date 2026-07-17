import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { startOfTodayInSaoPaulo } from "@/lib/utils";

// A live opened on a previous calendar day (America/Sao_Paulo) that's still
// "open" almost certainly means the admin forgot to close it — the system
// closes it automatically instead of letting a stale live linger indefinitely.
// Called opportunistically wherever live_sessions are read or a new one is
// opened, since there's no cron/scheduler in this stack to do it at midnight.
export async function closeStaleLiveSessions(
  supabase: SupabaseClient<Database>,
  tiktokAccountId: string,
) {
  await supabase
    .from("live_sessions")
    .update({ status: "closed" })
    .eq("tiktok_account_id", tiktokAccountId)
    .eq("status", "open")
    .lt("session_date", startOfTodayInSaoPaulo());
}
