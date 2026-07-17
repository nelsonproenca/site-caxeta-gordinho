"use client";

import { useActionState, useState } from "react";
import { createCaxetaoEvent, type ActionState } from "@/lib/actions/caxetao";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function CreateEventForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createCaxetaoEvent, null);
  const [closeRule, setCloseRule] = useState<"time" | "count" | "both">("both");
  const [formKey, setFormKey] = useState(0);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
      setCloseRule("both");
    }
  }

  const needsClosesAt = closeRule === "time" || closeRule === "both";
  const needsMaxPrincipals = closeRule === "count" || closeRule === "both";

  return (
    <form key={formKey} action={formAction} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="tiktok_account_id" value={accountId} />
      <Field label="Data do evento" htmlFor="event_date" className="w-44">
        <Input id="event_date" name="event_date" type="date" required />
      </Field>
      <Field label="Inscrições abrem" htmlFor="registration_opens_at" className="w-56">
        <Input id="registration_opens_at" name="registration_opens_at" type="datetime-local" required />
      </Field>
      <Field label="Regra de encerramento" htmlFor="close_rule" className="w-52">
        <Select
          id="close_rule"
          name="close_rule"
          required
          value={closeRule}
          onChange={(e) => setCloseRule(e.target.value as "time" | "count" | "both")}
        >
          <option value="both">Tempo ou quantidade</option>
          <option value="time">Só por tempo</option>
          <option value="count">Só por quantidade</option>
        </Select>
      </Field>
      {needsClosesAt && (
        <Field label="Inscrições fecham" htmlFor="registration_closes_at" className="w-56">
          <Input id="registration_closes_at" name="registration_closes_at" type="datetime-local" required />
        </Field>
      )}
      {needsMaxPrincipals && (
        <Field label="Vagas principais" htmlFor="max_principals" className="w-36">
          <Input id="max_principals" name="max_principals" type="number" min={1} step={1} required />
        </Field>
      )}
      <Field label="Vagas suplente" htmlFor="max_substitutes" hint="opcional" className="w-36">
        <Input id="max_substitutes" name="max_substitutes" type="number" min={0} step={1} />
      </Field>
      <Button type="submit" disabled={pending}>
        Criar Caxetão
      </Button>
      {state && "error" in state && <p className="error-text w-full">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green w-full">{state.success}</p>}
    </form>
  );
}
