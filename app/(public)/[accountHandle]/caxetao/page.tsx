import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncCaxetaoEventStatus } from "@/lib/caxetao";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CaxetaoRegisterForm } from "./caxetao-register-form";

// Safety-net revalidation for public pages under live load, same as the
// ranking page — not the primary invalidation path, just an upper bound on
// staleness (prd.md §11).
export const revalidate = 20;

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  registrations_open: "Inscrições abertas",
  registrations_closed: "Inscrições encerradas",
  in_progress: "Em andamento",
  finished: "Finalizado",
};

export default async function PublicCaxetaoPage({
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

  const { data: event } = await supabase
    .from("caxetao_events")
    .select("*")
    .eq("tiktok_account_id", account.id)
    .neq("status", "finished")
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const synced = event ? await syncCaxetaoEventStatus(supabase, event) : null;

  const { data: registrationRows } = synced
    ? await supabase
        .from("caxetao_registrations")
        .select("registration_type, queue_position, status, players(display_name, tiktok_handle)")
        .eq("caxetao_event_id", synced.id)
        .neq("status", "cancelled")
    : { data: null };

  const registrations = registrationRows ?? [];
  const principals = registrations.filter((r) => r.registration_type === "principal");
  const substitutes = registrations
    .filter((r) => r.registration_type === "substitute")
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));

  const isOpen = synced?.status === "registrations_open";

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 max-w-2xl mx-auto w-full">
      <div>
        <p className="caption">@{account.handle}</p>
        <h1 className="font-display text-4xl italic font-extrabold uppercase">Caxetão</h1>
      </div>

      {!synced && <p className="text-ink-dim">Nenhum Caxetão agendado no momento.</p>}

      {synced && (
        <>
          <Card className="flex flex-row items-center justify-between">
            <div>
              <span className="font-semibold">{formatDate(synced.event_date)}</span>
              <p className="text-ink-dim text-sm">
                Inscrições: {formatDateTime(synced.registration_opens_at)}
                {synced.registration_closes_at ? ` – ${formatDateTime(synced.registration_closes_at)}` : ""}
              </p>
            </div>
            <Badge variant={isOpen ? "green" : "neutral"}>{STATUS_LABEL[synced.status] ?? synced.status}</Badge>
          </Card>

          {isOpen && (
            <Card>
              <h2 className="font-display italic font-bold text-xl uppercase mb-4">Inscreva-se</h2>
              <CaxetaoRegisterForm eventId={synced.id} />
            </Card>
          )}

          {synced.status === "scheduled" && (
            <p className="text-ink-dim text-sm">
              Inscrições abrem em {formatDateTime(synced.registration_opens_at)}.
            </p>
          )}

          <Card>
            <h2 className="font-display italic font-bold text-xl uppercase mb-4">
              Principais ({principals.length}
              {synced.max_principals ? `/${synced.max_principals}` : ""})
            </h2>
            <div className="flex flex-wrap gap-2">
              {principals.map((r, i) => (
                <Badge key={i} variant="green">
                  {r.players?.display_name} (@{r.players?.tiktok_handle})
                </Badge>
              ))}
              {principals.length === 0 && <p className="text-ink-dim text-sm">Ninguém inscrito ainda.</p>}
            </div>
          </Card>

          {substitutes.length > 0 && (
            <Card>
              <h2 className="font-display italic font-bold text-xl uppercase mb-4">Fila de suplentes</h2>
              <div className="flex flex-col gap-2">
                {substitutes.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="mono-data">{r.queue_position}º</span>
                    <Badge variant="yellow">
                      {r.players?.display_name} (@{r.players?.tiktok_handle})
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
