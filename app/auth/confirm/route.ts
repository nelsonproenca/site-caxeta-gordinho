import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// @supabase/ssr clients default to the PKCE flow, so the confirmation email
// links here with `?code=...` (not the `token_hash`/`type` OTP flow from
// Supabase's older docs) — exchange it for a session before redirecting.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/contas";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  redirect("/admin/login?error=confirm_failed");
}
