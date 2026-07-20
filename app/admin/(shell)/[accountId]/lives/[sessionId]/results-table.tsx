"use client";

import { useActionState, useState } from "react";
import { recordMatchResult, updateMatchResult, removeParticipant, type ActionState } from "@/lib/actions/lives";
import { Field, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { TableWrap, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";

type Participant = { id: string; display_name: string; tiktok_handle: string };
type ScoringRule = { id: string; name: string; points: number };
type ResultData = {
  id: string;
  player_id: string;
  scoring_rule_id: string;
  points_awarded: number;
  scoring_rules: { name: string } | null;
};

// One row per live participant (created the moment they're added via
// Participantes, never a separate "history" row) — Lançar/Editar share one
// modal, Excluir removes the player from the live entirely, result and all.
// The modal itself is rendered once, outside the <table>, with the
// currently-targeted participant kept in state here — a <dialog> can't be a
// child of <tbody> (invalid HTML, and Next.js would hydrate-mismatch on it).
export function ResultsSection({
  sessionId,
  accountId,
  participants,
  results,
  scoringRules,
}: {
  sessionId: string;
  accountId: string;
  participants: Participant[];
  results: ResultData[];
  scoringRules: ScoringRule[];
}) {
  const [modalParticipant, setModalParticipant] = useState<Participant | null>(null);

  const resultByPlayer = new Map<string, ResultData>();
  for (const r of results) {
    if (!resultByPlayer.has(r.player_id)) resultByPlayer.set(r.player_id, r);
  }

  const activeResult = modalParticipant ? (resultByPlayer.get(modalParticipant.id) ?? null) : null;

  return (
    <>
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Jogador</TableHeaderCell>
              <TableHeaderCell>Resultado</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {participants.map((p) => {
              const result = resultByPlayer.get(p.id) ?? null;
              return (
                <TableRow key={p.id}>
                  <TableCell className="driver-cell">
                    {p.display_name} <span className="text-ink-dim">@{p.tiktok_handle}</span>
                  </TableCell>
                  <TableCell>
                    {result ? (result.scoring_rules?.name ?? "—") : <span className="text-ink-dim">—</span>}
                  </TableCell>
                  <TableCell className="mono-data">
                    {result ? (result.points_awarded > 0 ? `+${result.points_awarded}` : result.points_awarded) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="icon"
                        aria-label={result ? "Editar resultado" : "Lançar resultado"}
                        title={result ? "Editar" : "Lançar"}
                        onClick={() => setModalParticipant(p)}
                      >
                        {result ? "✎" : "+"}
                      </Button>
                      <RemoveButton
                        sessionId={sessionId}
                        accountId={accountId}
                        participant={p}
                        matchResultId={result?.id ?? null}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      {participants.length === 0 && (
        <p className="text-ink-dim mt-4">Adicione participantes para começar a lançar resultados.</p>
      )}

      <Modal open={modalParticipant !== null} onClose={() => setModalParticipant(null)}>
        {modalParticipant && (
          <ResultForm
            sessionId={sessionId}
            accountId={accountId}
            participant={modalParticipant}
            currentResult={activeResult}
            scoringRules={scoringRules}
            onDone={() => setModalParticipant(null)}
          />
        )}
      </Modal>
    </>
  );
}

function ResultForm({
  sessionId,
  accountId,
  participant,
  currentResult,
  scoringRules,
  onDone,
}: {
  sessionId: string;
  accountId: string;
  participant: Participant;
  currentResult: ResultData | null;
  scoringRules: ScoringRule[];
  onDone: () => void;
}) {
  const action = currentResult ? updateMatchResult : recordMatchResult;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) onDone();
  }

  return (
    <>
      <ModalHeader title="Lançar Resultado" onClose={onDone} />
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="account_id" value={accountId} />
        {currentResult ? (
          <input type="hidden" name="match_result_id" value={currentResult.id} />
        ) : (
          <input type="hidden" name="player_id" value={participant.id} />
        )}
        <Field label={`Resultado de ${participant.display_name}`} htmlFor="scoring_rule_id">
          <Select
            id="scoring_rule_id"
            name="scoring_rule_id"
            required
            autoFocus
            defaultValue={currentResult?.scoring_rule_id ?? ""}
          >
            <option value="" disabled>
              Selecione
            </option>
            {scoringRules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.points > 0 ? `+${r.points}` : r.points})
              </option>
            ))}
          </Select>
        </Field>
        {state && "error" in state && <p className="error-text">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            OK
          </Button>
        </div>
      </form>
    </>
  );
}

function RemoveButton({
  sessionId,
  accountId,
  participant,
  matchResultId,
}: {
  sessionId: string;
  accountId: string;
  participant: Participant;
  matchResultId: string | null;
}) {
  return (
    <form action={removeParticipant}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="account_id" value={accountId} />
      <input type="hidden" name="player_id" value={participant.id} />
      {matchResultId && <input type="hidden" name="match_result_id" value={matchResultId} />}
      <Button
        type="submit"
        variant="icon"
        aria-label="Remover jogador"
        title="Excluir"
        onClick={(e) => {
          if (!confirm(`Remover ${participant.display_name} desta live?`)) {
            e.preventDefault();
          }
        }}
      >
        ✕
      </Button>
    </form>
  );
}
