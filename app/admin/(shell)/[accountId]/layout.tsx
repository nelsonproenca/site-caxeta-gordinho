import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("tiktok_accounts")
    .select("id, handle, display_name")
    .eq("id", accountId)
    .maybeSingle();

  if (!account) {
    notFound();
  }

  const tabs = [
    { href: `/admin/${accountId}/pontuacao`, label: "Pontuação" },
    { href: `/admin/${accountId}/jogadores`, label: "Jogadores" },
    { href: `/admin/${accountId}/lives`, label: "Lives" },
    { href: `/admin/${accountId}/ranking`, label: "Ranking" },
    { href: `/admin/${accountId}/caxetao`, label: "Caxetão" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/contas" className="caption">
          ← Minhas contas
        </Link>
        <h1 className="font-display text-3xl italic font-extrabold uppercase mt-2">
          @{account.handle}
        </h1>
        <p className="text-ink-dim">{account.display_name}</p>
      </div>
      <div className="flex gap-2 border-b border-stroke pb-3">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="btn btn-ghost btn-sm">
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
