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
