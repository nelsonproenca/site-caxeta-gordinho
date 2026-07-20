"use client";

import { useActionState, useState } from "react";
import { recordMatchResult, type ActionState } from "@/lib/actions/lives";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";

type Participant = { id: string; display_name: string; tiktok_handle: string };
type ScoringRule = { id: string; name: string; points: number };

// One row per participant, always available (not just until their first
// result) — a player can play several matches in one live. Clicking
// "Lançar" swaps it for a <select>; picking a rule submits immediately
// (no separate confirm step) and the new match_result shows up as its own
// row in the history below once the page revalidates.
export function QuickAddRow({
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
  const [showPicker, setShowPicker] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
      setShowPicker(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="driver-cell">
        {participant.display_name} <span className="text-ink-dim">@{participant.tiktok_handle}</span>
      </TableCell>
      <TableCell colSpan={2}>
        <form key={formKey} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="player_id" value={participant.id} />
          {showPicker ? (
            <Select
              name="scoring_rule_id"
              autoFocus
              required
              defaultValue=""
              disabled={pending}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="w-56"
            >
              <option value="">Selecione a pontuação</option>
              {scoringRules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.points > 0 ? `+${r.points}` : r.points})
                </option>
              ))}
            </Select>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPicker(true)}>
              Lançar
            </Button>
          )}
          {pending && <span className="text-ink-dim text-xs">Enviando…</span>}
        </form>
        {state && "error" in state && <p className="error-text text-xs mt-1">{state.error}</p>}
      </TableCell>
    </TableRow>
  );
}
