"use client";

import { useActionState } from "react";
import { createScorePeriod, type ActionState } from "@/lib/actions/score-periods";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function CreatePeriodForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createScorePeriod, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="tiktok_account_id" value={accountId} />
      <Field label="Label" htmlFor="label" className="flex-1 min-w-[200px]">
        <Input id="label" name="label" type="text" required placeholder="Ex: Julho 2026" />
      </Field>
      <Field label="Tipo" htmlFor="type" className="w-40">
        <Select id="type" name="type" defaultValue="season" required>
          <option value="season">Temporada</option>
          <option value="week">Semana</option>
        </Select>
      </Field>
      <Field label="Início" htmlFor="starts_at" className="w-44">
        <Input id="starts_at" name="starts_at" type="date" required defaultValue={today} />
      </Field>
      <Button type="submit" disabled={pending}>
        Abrir período
      </Button>
      {state && "error" in state && <p className="error-text w-full">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green w-full">{state.success}</p>}
    </form>
  );
}
