import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type RankingEntry = {
  playerId: string;
  displayName: string;
  tiktokHandle: string;
  totalPoints: number;
  positiveResults: number;
};

// Tie-break is points desc -> count of positive-point results desc -> handle
// alphabetical. prd.md §12 flags the exact "vitórias lambreta" tie-break as
// still open with the stakeholder (scoring_rules has no category column yet
// to distinguish a lambreta win from a normal one) — revisit once decided.
export async function getRanking(
  supabase: SupabaseClient<Database>,
  tiktokAccountId: string,
): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from("match_results")
    .select("points_awarded, player_id, players(display_name, tiktok_handle), matches!inner(tiktok_account_id)")
    .eq("matches.tiktok_account_id", tiktokAccountId);

  if (error) throw error;

  const byPlayer = new Map<string, RankingEntry>();

  for (const row of data ?? []) {
    const player = row.players;
    if (!player) continue;

    const existing = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      displayName: player.display_name,
      tiktokHandle: player.tiktok_handle,
      totalPoints: 0,
      positiveResults: 0,
    };

    existing.totalPoints += row.points_awarded;
    if (row.points_awarded > 0) existing.positiveResults += 1;

    byPlayer.set(row.player_id, existing);
  }

  return [...byPlayer.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.positiveResults !== a.positiveResults) return b.positiveResults - a.positiveResults;
    return a.tiktokHandle.localeCompare(b.tiktokHandle);
  });
}
