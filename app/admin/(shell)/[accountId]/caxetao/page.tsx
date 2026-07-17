import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { syncCaxetaoEventStatus } from "@/lib/caxetao";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateEventForm } from "./create-event-form";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  registrations_open: "Inscrições abertas",
  registrations_closed: "Inscrições encerradas",
  in_progress: "Em andamento",
  finished: "Finalizado",
};

const STATUS_VARIANT: Record<string, "neutral" | "green" | "yellow" | "purple"> = {
  scheduled: "neutral",
  registrations_open: "green",
  registrations_closed: "yellow",
  in_progress: "purple",
  finished: "neutral",
};

export default async function CaxetaoPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("caxetao_events")
    .select("*")
    .eq("tiktok_account_id", accountId)
    .order("event_date", { ascending: false });

  // Lazily flip status the same way closeStaleLiveSessions does for lives —
  // no cron in this stack, so a stale "scheduled"/"registrations_open" row
  // only catches up to the wall clock when this page is loaded.
  const events = await Promise.all(
    (rows ?? []).map((event) =>
      event.status === "scheduled" || event.status === "registrations_open"
        ? syncCaxetaoEventStatus(supabase, event)
        : event,
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-display italic font-bold text-xl uppercase mb-4">Novo Caxetão</h2>
        <CreateEventForm accountId={accountId} />
      </Card>

      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <Link key={event.id} href={`/admin/${accountId}/caxetao/${event.id}`}>
            <Card className="flex flex-row items-center justify-between">
              <div>
                <span className="font-semibold">{formatDate(event.event_date)}</span>
                <span className="text-ink-dim text-sm ml-2">
                  Inscrições: {formatDateTime(event.registration_opens_at)}
                  {event.registration_closes_at ? ` – ${formatDateTime(event.registration_closes_at)}` : ""}
                </span>
              </div>
              <Badge variant={STATUS_VARIANT[event.status] ?? "neutral"}>
                {STATUS_LABEL[event.status] ?? event.status}
              </Badge>
            </Card>
          </Link>
        ))}
        {events.length === 0 && <p className="text-ink-dim">Nenhum Caxetão criado ainda.</p>}
      </div>
    </div>
  );
}
