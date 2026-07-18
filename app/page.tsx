import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardGrid } from "@/components/ui/card";

// Public landing page — the primary audience is players (no login: pick a
// streamer, land on their public ranking/Caxetão/cadastro pages, see
// [accountHandle]/layout.tsx for that nav). Admin access is a small,
// deliberately de-emphasized link at the bottom, not the main flow.
export default async function Home() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("tiktok_accounts")
    .select("handle, display_name")
    .eq("is_active", true)
    .order("display_name");

  return (
    <main className="flex flex-1 flex-col items-center gap-10 p-8 sm:p-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="caption">Caxeta Gordinho</p>
        <h1 className="font-display text-5xl italic font-extrabold uppercase text-ink">
          Ranking, <span className="text-red">Caxetão</span> e Campeonatos
        </h1>
        <p className="max-w-md text-ink-dim">
          Acompanhe o ranking, inscreva-se no Caxetão e veja os resultados das lives — sem
          precisar de cadastro pra navegar.
        </p>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 text-left">
        <h2 className="font-display italic font-bold text-xl uppercase text-ink-dim text-center">
          Escolha um streamer
        </h2>
        {(accounts ?? []).length > 0 ? (
          <CardGrid>
            {(accounts ?? []).map((account) => (
              <Link key={account.handle} href={`/${account.handle}/ranking`}>
                <Card>
                  <span className="font-display italic font-bold text-lg">@{account.handle}</span>
                  <p className="text-ink-dim text-sm">{account.display_name}</p>
                </Card>
              </Link>
            ))}
          </CardGrid>
        ) : (
          <p className="text-ink-dim text-center">Nenhuma conta ativa no momento.</p>
        )}
      </div>

      <Link href="/admin/login" className="btn btn-ghost btn-sm">
        Sou administrador →
      </Link>
    </main>
  );
}
