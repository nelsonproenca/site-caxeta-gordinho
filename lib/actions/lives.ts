"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { closeStaleLiveSessions } from "@/lib/live-sessions";
import { normalizeHandle } from "@/lib/utils";

export type ActionState = { error: string } | { success: string } | null;

export async function openLiveSession(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  await closeStaleLiveSessions(supabase, accountId);

  const { data: openPeriod } = await supabase
    .from("score_periods")
    .select("id")
    .eq("tiktok_account_id", accountId)
    .eq("status", "open")
    .maybeSingle();

  const { data, error } = await supabase
    .from("live_sessions")
    .insert({
      tiktok_account_id: accountId,
      session_date: new Date().toISOString(),
      score_period_id: openPeriod?.id ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao abrir live");
  }

  redirect(`/admin/${accountId}/lives/${data.id}`);
}

export async function closeLiveSession(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");

  const supabase = await createClient();
  await supabase.from("live_sessions").update({ status: "closed" }).eq("id", sessionId);

  revalidatePath(`/admin/${accountId}/lives/${sessionId}`);
}

export async function addParticipant(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = String(formData.get("session_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const handle = normalizeHandle(String(formData.get("tiktok_handle") ?? ""));

  if (!handle) return { error: "Informe o @tiktok do jogador." };

  const supabase = await createClient();

  let { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("tiktok_handle", handle)
    .maybeSingle();

  if (!player) {
    if (!displayName) {
      return { error: "Jogador novo — informe o nome também." };
    }
    const service = createServiceClient();
    const { data: created, error: createError } = await service
      .from("players")
      .insert({ display_name: displayName, tiktok_handle: handle })
      .select("id")
      .single();
    if (createError || !created) {
      return { error: createError?.message ?? "Falha ao criar jogador." };
    }
    player = created;
  }

  const { error } = await supabase
    .from("live_participants")
    .insert({ live_session_id: sessionId, player_id: player.id });

  if (error) {
    if (error.code === "23505") return { error: "Jogador já está na live." };
    return { error: error.message };
  }

  revalidatePath(`/admin/${accountId}/lives/${sessionId}`);
  return { success: `@${handle} adicionado.` };
}

export async function recordMatchResult(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = String(formData.get("session_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const playerId = String(formData.get("player_id") ?? "");
  const scoringRuleId = String(formData.get("scoring_rule_id") ?? "");

  if (!playerId || !scoringRuleId) return { error: "Selecione jogador e resultado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada, faça login novamente." };

  const { data: rule } = await supabase
    .from("scoring_rules")
    .select("points")
    .eq("id", scoringRuleId)
    .maybeSingle();

  if (!rule) return { error: "Regra de pontuação não encontrada." };

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({ tiktok_account_id: accountId, live_session_id: sessionId })
    .select("id")
    .single();

  if (matchError || !match) return { error: matchError?.message ?? "Falha ao registrar partida." };

  const { error: resultError } = await supabase.from("match_results").insert({
    match_id: match.id,
    player_id: playerId,
    scoring_rule_id: scoringRuleId,
    points_awarded: rule.points,
    recorded_by: user.id,
  });

  if (resultError) return { error: resultError.message };

  revalidatePath(`/admin/${accountId}/lives/${sessionId}`);
  return { success: "Resultado lançado." };
}

// prd.md §4.3: closing a live doesn't block correcting a bad entry
// afterwards, but every correction gets logged (match_result_edits,
// 20260719000019) — who, when, and what it was before, since points_awarded
// is a snapshot that would otherwise just silently change with no trace.
export async function updateMatchResult(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const matchResultId = String(formData.get("match_result_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const scoringRuleId = String(formData.get("scoring_rule_id") ?? "");

  if (!matchResultId || !scoringRuleId) return { error: "Selecione o novo resultado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada, faça login novamente." };

  const { data: current } = await supabase
    .from("match_results")
    .select("scoring_rule_id, points_awarded, matches!inner(tiktok_account_id)")
    .eq("id", matchResultId)
    .single();
  if (!current) return { error: "Resultado não encontrado." };

  const { data: newRule } = await supabase
    .from("scoring_rules")
    .select("points")
    .eq("id", scoringRuleId)
    .maybeSingle();
  if (!newRule) return { error: "Regra de pontuação não encontrada." };

  const { error: logError } = await supabase.from("match_result_edits").insert({
    match_result_id: matchResultId,
    action: "update",
    previous_scoring_rule_id: current.scoring_rule_id,
    previous_points_awarded: current.points_awarded,
    new_scoring_rule_id: scoringRuleId,
    new_points_awarded: newRule.points,
    edited_by: user.id,
    tiktok_account_id: current.matches.tiktok_account_id,
  });
  if (logError) return { error: logError.message };

  const { error } = await supabase
    .from("match_results")
    .update({ scoring_rule_id: scoringRuleId, points_awarded: newRule.points })
    .eq("id", matchResultId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/${accountId}/lives/${sessionId}`);
  return { success: "Resultado atualizado." };
}

// Results list ("Resultados" card) has exactly one row per live_participant
// — "Excluir" on that row removes the player from the live entirely (not
// just their result): their match_result (if any, logged to
// match_result_edits first, same as an edit) and their live_participants
// row both go. Scoring them again means re-adding them via Participantes,
// which is the point — a fresh row, not a stray "empty" one left behind.
export async function removeParticipant(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const playerId = String(formData.get("player_id") ?? "");
  const matchResultId = String(formData.get("match_result_id") ?? "") || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (matchResultId) {
    const { data: current } = await supabase
      .from("match_results")
      .select("match_id, scoring_rule_id, points_awarded, matches!inner(tiktok_account_id)")
      .eq("id", matchResultId)
      .single();

    if (current) {
      await supabase.from("match_result_edits").insert({
        match_result_id: matchResultId,
        action: "delete",
        previous_scoring_rule_id: current.scoring_rule_id,
        previous_points_awarded: current.points_awarded,
        edited_by: user.id,
        tiktok_account_id: current.matches.tiktok_account_id,
      });

      await supabase.from("match_results").delete().eq("id", matchResultId);
      // Every match_result created via recordMatchResult owns a dedicated
      // matches row — clean it up too instead of leaving an empty orphan
      // behind now that its one result is gone.
      await supabase.from("matches").delete().eq("id", current.match_id);
    }
  }

  await supabase.from("live_participants").delete().eq("live_session_id", sessionId).eq("player_id", playerId);

  revalidatePath(`/admin/${accountId}/lives/${sessionId}`);
}
