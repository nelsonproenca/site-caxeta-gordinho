import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CreateAccountForm } from "../create-account-form";

export default function NovaContaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl italic font-extrabold uppercase">Nova conta TikTok</h1>
        <p className="text-ink-dim">Cadastre uma conta TikTok gerenciada para começar a lançar lives.</p>
      </div>

      <Card className="max-w-md">
        <CreateAccountForm />
      </Card>

      <Link href="/admin/contas" className="caption text-red w-fit">
        ← Ver contas cadastradas
      </Link>
    </div>
  );
}
