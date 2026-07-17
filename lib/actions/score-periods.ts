"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | { success: string } | null;

export async function createScorePeriod(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tiktokAccountId = String(formData.get("tiktok_account_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");

  if (!tiktokAccountId || !label || (type !== "week" && type !== "season") || !startsAt) {
    return { error: "Preencha label, tipo e data de início." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("score_periods").insert({
    tiktok_account_id: tiktokAccountId,
    label,
    type,
    starts_at: startsAt,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um período aberto para essa conta. Encerre o atual antes de abrir outro." };
    }
    return { error: error.message };
  }

  revalidatePath(`/admin/${tiktokAccountId}/ranking`);
  return { success: `Período "${label}" aberto.` };
}

export async function closeScorePeriod(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tiktokAccountId = String(formData.get("tiktok_account_id") ?? "");

  const supabase = await createClient();
  await supabase
    .from("score_periods")
    .update({ status: "closed", ends_at: new Date().toISOString().slice(0, 10) })
    .eq("id", id);

  revalidatePath(`/admin/${tiktokAccountId}/ranking`);
}
