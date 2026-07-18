"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// RLS (admins_approve_pending, 20260718000018) enforces both that the caller
// is an approved admin and that this can only move a row pending -> approved
// — no application-level role check needed here, same reasoning as every
// other admin-facing write in this codebase.
export async function approvePendingAdmin(formData: FormData) {
  const adminId = String(formData.get("admin_id") ?? "");
  if (!adminId) return;

  const supabase = await createClient();
  await supabase.from("admins").update({ status: "approved" }).eq("id", adminId);

  revalidatePath("/admin/solicitacoes");
}

// "Excluir" removes the request outright — admins.id -> auth.users.id is ON
// DELETE CASCADE, but deleting an auth.users row at all requires the
// service-role admin API (no RLS policy can do this, admins has no delete
// policy). Service role bypasses RLS entirely, so — unlike approvePendingAdmin
// above — the caller's own approved status has to be checked explicitly here.
export async function rejectPendingAdmin(formData: FormData) {
  const adminId = String(formData.get("admin_id") ?? "");
  if (!adminId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: caller } = await supabase.from("admins").select("status").eq("id", user.id).maybeSingle();
  if (caller?.status !== "approved") return;

  const service = createServiceClient();
  await service.auth.admin.deleteUser(adminId);

  revalidatePath("/admin/solicitacoes");
}
