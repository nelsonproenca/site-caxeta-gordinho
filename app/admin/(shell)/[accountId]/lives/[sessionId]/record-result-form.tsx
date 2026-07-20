"use client";

import { useActionState, useState } from "react";
import { recordMatchResult, type ActionState } from "@/lib/actions/lives";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Participant = { id: string; display_name: string; tiktok_handle: string };
type ScoringRule = { id: string; name: string; points: number };

// One independent form per participant row — each needs its own pending/
// error/success state, so this can't be a single shared useActionState like
// the old one-dropdown-to-pick-the-player version.
function ResultRow({
  sessionId,
  accountId,
  participant,
  scoringRules,
}: {
  sessionId: string;
  accountId: string;
  participant: Participant;
  scoringRules: ScoringRule[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordMatchResult, null);
  const [formKey, setFormKey] = useState(0);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) setFormKey((k) => k + 1);
  }

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-wrap items-center gap-3 py-3 border-b border-stroke-soft last:border-b-0"
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="account_id" value={accountId} />
      <input type="hidden" name="player_id" value={participant.id} />
      <span className="flex-1 min-w-[160px]">
        {participant.display_name} <span className="text-ink-dim">@{participant.tiktok_handle}</span>
      </span>
      <Select name="scoring_rule_id" required defaultValue="" className="w-56">
        <option value="">Selecione</option>
        {scoringRules.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.points > 0 ? `+${r.points}` : r.points})
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        Lançar
      </Button>
      {state && "error" in state && <p className="error-text basis-full">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green basis-full">{state.success}</p>}
    </form>
  );
}

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
  if (participants.length === 0) {
    return <p className="text-ink-dim text-sm">Adicione participantes à live antes de lançar resultados.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-3 pb-2">
        <span className="caption flex-1 min-w-[160px]">Jogador</span>
        <span className="caption w-56">Resultado</span>
      </div>
      {participants.map((p) => (
        <ResultRow
          key={p.id}
          sessionId={sessionId}
          accountId={accountId}
          participant={p}
          scoringRules={scoringRules}
        />
      ))}
    </div>
  );
}
