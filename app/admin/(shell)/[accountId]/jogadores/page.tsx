import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { TableWrap, Table, TableHead, TableBody, TableRow, TableHeaderCell } from "@/components/ui/table";
import { PlayerForm } from "@/components/player-form";
import { PlayerRow } from "./player-row";

export default async function JogadoresPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const returnPath = `/admin/${accountId}/jogadores`;
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, tiktok_handle, whatsapp")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-display italic font-bold text-xl uppercase mb-4">Novo jogador</h2>
        <p className="text-ink-dim text-sm mb-4">
          Cadastro é global à plataforma — o mesmo jogador pode participar de outras contas gerenciadas.
        </p>
        <PlayerForm returnPath={returnPath} />
      </Card>

      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Jogador</TableHeaderCell>
              <TableHeaderCell>@tiktok</TableHeaderCell>
              <TableHeaderCell>WhatsApp</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(players ?? []).map((p) => (
              <PlayerRow key={p.id} player={p} returnPath={returnPath} />
            ))}
          </TableBody>
        </Table>
      </TableWrap>
      {(players ?? []).length === 0 && <p className="text-ink-dim">Nenhum jogador cadastrado ainda.</p>}
    </div>
  );
}
