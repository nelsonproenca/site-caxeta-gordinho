"use client";

import { useActionState } from "react";
import { createTiktokAccount, type ActionState } from "@/lib/actions/accounts";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createTiktokAccount, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="@tiktok" htmlFor="handle">
        <Input id="handle" name="handle" type="text" required placeholder="usuario" />
      </Field>
      <Field label="Nome de exibição" htmlFor="display_name">
        <Input id="display_name" name="display_name" type="text" required placeholder="Nome do canal" />
      </Field>
      {state && "error" in state && <p className="error-text">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        Criar conta
      </Button>
    </form>
  );
}
