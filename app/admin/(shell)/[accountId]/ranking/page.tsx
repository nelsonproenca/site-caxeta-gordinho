import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPeriodRanking } from "@/lib/scoring/get-ranking";
import { closeScorePeriod } from "@/lib/actions/score-periods";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankingBoard } from "@/components/ranking-board";
import { CreatePeriodForm } from "./create-period-form";

export default async function RankingPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("score_periods")
    .select("id, label, type, starts_at, ends_at, status")
    .eq("tiktok_account_id", accountId)
    .order("starts_at", { ascending: false });

  const openPeriod = (periods ?? []).find((p) => p.status === "open");
  const closedPeriods = (periods ?? []).filter((p) => p.status === "closed");

  const ranking = openPeriod ? await getPeriodRanking(supabase, openPeriod.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        {openPeriod ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display italic font-bold text-xl uppercase">{openPeriod.label}</h2>
                <p className="text-ink-dim text-sm">
                  {openPeriod.type === "week" ? "Semana" : "Temporada"} · desde {formatDate(openPeriod.starts_at)}
                </p>
              </div>
              <form action={closeScorePeriod}>
                <input type="hidden" name="id" value={openPeriod.id} />
                <input type="hidden" name="tiktok_account_id" value={accountId} />
                <button type="submit" className="btn btn-outline btn-sm">
                  Encerrar período
                </button>
              </form>
            </div>
            <RankingBoard ranking={ranking} />
          </>
        ) : (
          <>
            <h2 className="font-display italic font-bold text-xl uppercase mb-2">Nenhum período aberto</h2>
            <p className="text-ink-dim text-sm mb-4">
              Abra um período para os resultados das próximas lives começarem a contar para um ranking.
            </p>
            <CreatePeriodForm accountId={accountId} />
          </>
        )}
      </Card>

      <div>
        <h2 className="font-display italic font-bold text-xl uppercase mb-4">Períodos anteriores</h2>
        <div className="flex flex-col gap-3">
          {closedPeriods.map((p) => (
            <Link key={p.id} href={`/admin/${accountId}/ranking/${p.id}`}>
              <Card className="flex flex-row items-center justify-between">
                <div>
                  <span className="font-semibold">{p.label}</span>
                  <span className="text-ink-dim text-sm ml-2">
                    {formatDate(p.starts_at)} – {p.ends_at ? formatDate(p.ends_at) : "?"}
                  </span>
                </div>
                <Badge variant="neutral">{p.type === "week" ? "Semana" : "Temporada"}</Badge>
              </Card>
            </Link>
          ))}
          {closedPeriods.length === 0 && <p className="text-ink-dim">Nenhum período encerrado ainda.</p>}
        </div>
      </div>
    </div>
  );
}
