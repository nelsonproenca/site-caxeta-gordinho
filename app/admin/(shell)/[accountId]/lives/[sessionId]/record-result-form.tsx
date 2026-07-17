"use client";

import { useActionState } from "react";
import { recordMatchResult, type ActionState } from "@/lib/actions/lives";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Participant = { id: string; display_name: string; tiktok_handle: string };
type ScoringRule = { id: string; name: string; points: number };

export function RecordResultForm({
  sessionId,
  accountId,
  participants,
  scoringRules,
}: {
  sessionId: string;
  accountId: string;
  participants: Participant[];
  scoringRules: ScoringRule[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordMatchResult, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="account_id" value={accountId} />
      <div className="flex flex-col gap-2">
        <label htmlFor="player_id" className="caption">
          Jogador
        </label>
        <Select id="player_id" name="player_id" required className="w-48">
          <option value="">Selecione</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name} (@{p.tiktok_handle})
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="scoring_rule_id" className="caption">
          Resultado
        </label>
        <Select id="scoring_rule_id" name="scoring_rule_id" required className="w-48">
          <option value="">Selecione</option>
          {scoringRules.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.points > 0 ? `+${r.points}` : r.points})
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        Lançar resultado
      </Button>
      {state && "error" in state && <p className="error-text w-full">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green w-full">{state.success}</p>}
    </form>
  );
}
