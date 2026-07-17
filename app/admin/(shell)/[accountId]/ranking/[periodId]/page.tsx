import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPeriodRanking } from "@/lib/scoring/get-ranking";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankingBoard } from "@/components/ranking-board";

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ accountId: string; periodId: string }>;
}) {
  const { periodId } = await params;
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("score_periods")
    .select("id, label, type, starts_at, ends_at, status")
    .eq("id", periodId)
    .maybeSingle();

  if (!period) notFound();

  const ranking = await getPeriodRanking(supabase, period.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl italic font-extrabold uppercase">{period.label}</h1>
          <p className="text-ink-dim">
            {period.type === "week" ? "Semana" : "Temporada"} · {formatDate(period.starts_at)} –{" "}
            {period.ends_at ? formatDate(period.ends_at) : "em aberto"}
          </p>
        </div>
        <Badge variant={period.status === "open" ? "green" : "neutral"}>
          {period.status === "open" ? "Aberto" : "Encerrado"}
        </Badge>
      </div>
      <Card>
        <RankingBoard ranking={ranking} />
      </Card>
    </div>
  );
}
