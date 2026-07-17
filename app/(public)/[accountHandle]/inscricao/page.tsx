import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/player-form";

export default async function InscricaoPage({
  params,
}: {
  params: Promise<{ accountHandle: string }>;
}) {
  const { accountHandle } = await params;
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("tiktok_accounts")
    .select("handle, display_name")
    .eq("handle", accountHandle.toLowerCase())
    .maybeSingle();

  if (!account) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <p className="caption">@{account.handle}</p>
        <h1 className="font-display text-3xl italic font-extrabold uppercase">Cadastro de jogador</h1>
        <p className="text-ink-dim max-w-md mx-auto mt-2">
          Cadastre-se para participar das lives e aparecer no ranking de {account.display_name}.
        </p>
      </div>
      <PlayerForm />
    </main>
  );
}
