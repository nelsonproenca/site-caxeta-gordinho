import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CreateRuleForm } from "./create-rule-form";
import { RuleCard } from "./rule-card";

export default async function PontuacaoPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("scoring_rules")
    .select("id, name, points, is_active")
    .eq("tiktok_account_id", accountId)
    .order("points", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-display italic font-bold text-xl uppercase mb-4">Nova regra</h2>
        <CreateRuleForm accountId={accountId} />
      </Card>

      <div className="flex flex-col gap-3">
        {(rules ?? []).map((rule) => (
          <RuleCard key={rule.id} rule={rule} accountId={accountId} />
        ))}
        {(rules ?? []).length === 0 && <p className="text-ink-dim">Nenhuma regra cadastrada.</p>}
      </div>
    </div>
  );
}
