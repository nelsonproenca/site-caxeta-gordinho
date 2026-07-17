import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { openLiveSession } from "@/lib/actions/lives";
import { closeStaleLiveSessions } from "@/lib/live-sessions";
import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LivesPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  await closeStaleLiveSessions(supabase, accountId);
  const { data: sessions } = await supabase
    .from("live_sessions")
    .select("id, session_date, status")
    .eq("tiktok_account_id", accountId)
    .order("session_date", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-display italic font-bold text-xl uppercase">Nova live</h2>
          <p className="text-ink-dim text-sm">Abre uma sessão para lançar resultados em tempo real.</p>
        </div>
        <form action={openLiveSession}>
          <input type="hidden" name="account_id" value={accountId} />
          <Button type="submit">Abrir live</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {(sessions ?? []).map((s) => (
          <Link key={s.id} href={`/admin/${accountId}/lives/${s.id}`}>
            <Card className="flex flex-row items-center justify-between">
              <span className="mono-data">{formatDateTime(s.session_date)}</span>
              <Badge variant={s.status === "open" ? "green" : "neutral"}>
                {s.status === "open" ? "Aberta" : "Encerrada"}
              </Badge>
            </Card>
          </Link>
        ))}
        {(sessions ?? []).length === 0 && <p className="text-ink-dim">Nenhuma live registrada ainda.</p>}
      </div>
    </div>
  );
}
