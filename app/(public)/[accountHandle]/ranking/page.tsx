import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRanking } from "@/lib/scoring/get-ranking";
import {
  TableWrap,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";

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

  const ranking = await getRanking(supabase, account.id);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 max-w-3xl mx-auto w-full">
      <div>
        <p className="caption">@{account.handle}</p>
        <h1 className="font-display text-4xl italic font-extrabold uppercase">Ranking</h1>
        <p className="text-ink-dim">{account.display_name}</p>
      </div>

      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Pos</TableHeaderCell>
              <TableHeaderCell>Jogador</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((entry, index) => (
              <TableRow key={entry.playerId}>
                <TableCell className="pos-cell">{String(index + 1).padStart(2, "0")}</TableCell>
                <TableCell className="driver-cell">
                  {entry.displayName} <span className="text-titanium">(@{entry.tiktokHandle})</span>
                </TableCell>
                <TableCell className="mono-data">{entry.totalPoints}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
      {ranking.length === 0 && <p className="text-ink-dim">Ainda sem resultados registrados.</p>}
    </main>
  );
}
