import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRanking, getPeriodRanking } from "@/lib/scoring/get-ranking";
import { formatDate } from "@/lib/utils";
import { RankingBoard } from "@/components/ranking-board";

// Safety-net revalidation for public pages under live load (see the
// engineering plan's risk section) — not the primary invalidation path,
// just an upper bound on staleness.
export const revalidate = 20;

export default async function RankingPage({
  params,
}: {
  params: Promise<{ accountHandle: string }>;
}) {
  const { accountHandle } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("tiktok_accounts")
    .select("id, handle, display_name")
    .eq("handle", accountHandle.toLowerCase())
    .maybeSingle();

  if (!account) notFound();

  const { data: openPeriod } = await supabase
    .from("score_periods")
    .select("id, label, type, starts_at")
    .eq("tiktok_account_id", account.id)
    .eq("status", "open")
    .maybeSingle();

  const ranking = openPeriod
    ? await getPeriodRanking(supabase, openPeriod.id)
    : await getRanking(supabase, account.id);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 max-w-3xl mx-auto w-full">
      <div>
        <p className="caption">@{account.handle}</p>
        <h1 className="font-display text-4xl italic font-extrabold uppercase">
          {openPeriod ? openPeriod.label : "Ranking"}
        </h1>
        <p className="text-ink-dim">
          {openPeriod
            ? `${openPeriod.type === "week" ? "Semana" : "Temporada"} · desde ${formatDate(openPeriod.starts_at)}`
            : account.display_name}
        </p>
      </div>

      <RankingBoard ranking={ranking} />
    </main>
  );
}
