"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeHandle } from "@/lib/utils";

export type ActionState = { error: string } | { success: string } | null;

export async function createPlayer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const tiktokHandle = normalizeHandle(String(formData.get("tiktok_handle") ?? ""));
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const returnPath = String(formData.get("return_path") ?? "");

  if (!displayName || !tiktokHandle) {
    return { error: "Preencha nome e @tiktok." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("players")
    .insert({ display_name: displayName, tiktok_handle: tiktokHandle, whatsapp });

  if (error) {
    if (error.code === "23505") {
      return { error: `Já existe um jogador com @${tiktokHandle}.` };
    }
    return { error: error.message };
  }

  if (returnPath) revalidatePath(returnPath);
  return { success: `Jogador @${tiktokHandle} cadastrado.` };
}

export async function updatePlayer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const tiktokHandle = normalizeHandle(String(formData.get("tiktok_handle") ?? ""));
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const returnPath = String(formData.get("return_path") ?? "");

  if (!id || !displayName || !tiktokHandle) {
    return { error: "Preencha nome e @tiktok." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("players")
    .update({ display_name: displayName, tiktok_handle: tiktokHandle, whatsapp })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: `Já existe um jogador com @${tiktokHandle}.` };
    }
    return { error: error.message };
  }

  if (returnPath) revalidatePath(returnPath);
  return { success: `Jogador @${tiktokHandle} atualizado.` };
}

export async function deletePlayer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const returnPath = String(formData.get("return_path") ?? "");

  if (!id) return { error: "Jogador inválido." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) return { error: error.message };

  if (returnPath) revalidatePath(returnPath);
  return { success: "Jogador excluído." };
}

// Backs the @tiktok autocomplete in the live's "Participantes" card — public
// select policy on players (players_select_public) means the request-scoped
// client is enough, no service role needed for a read.
export async function searchPlayers(query: string) {
  const safe = normalizeHandle(query).replace(/[,()%_]/g, "");
  if (safe.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("id, display_name, tiktok_handle")
    .or(`tiktok_handle.ilike.%${safe}%,display_name.ilike.%${safe}%`)
    .order("display_name")
    .limit(8);

  return data ?? [];
}
