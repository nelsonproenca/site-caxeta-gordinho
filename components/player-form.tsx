"use client";

import { useActionState, useState } from "react";
import { createPlayer, type ActionState } from "@/lib/actions/players";
import { Field, Input, PhoneInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function PlayerForm({ returnPath }: { returnPath?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createPlayer, null);
  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);

  // Remounting the form on success clears every field, including PhoneInput's
  // internal masked state, which a plain form.reset() wouldn't touch. Done
  // during render (not an effect) per React's "adjust state on change" pattern.
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-wrap items-end gap-4">
      {returnPath && <input type="hidden" name="return_path" value={returnPath} />}
      <Field label="Nome" htmlFor="display_name" className="flex-1 min-w-[160px]">
        <Input id="display_name" name="display_name" type="text" required placeholder="Nome do jogador" />
      </Field>
      <Field label="@tiktok" htmlFor="tiktok_handle" className="flex-1 min-w-[160px]">
        <Input id="tiktok_handle" name="tiktok_handle" type="text" required placeholder="usuario" />
      </Field>
      <Field
        label="WhatsApp"
        htmlFor="whatsapp"
        info="Campo WhatsApp é opcional"
        className="flex-1 min-w-[160px]"
      >
        <PhoneInput id="whatsapp" name="whatsapp" placeholder="(11) 91234-5678" />
      </Field>
      <Button type="submit" disabled={pending}>
        Cadastrar
      </Button>
      {state && "error" in state && <p className="error-text w-full">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green w-full">{state.success}</p>}
    </form>
  );
}
