"use client";

import { useActionState } from "react";
import { addModerator, type ActionState } from "@/lib/actions/accounts";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function AddModeratorForm({ tiktokAccountId }: { tiktokAccountId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addModerator, null);

  return (
    <form action={formAction} className="flex flex-col gap-2 mt-4 pt-4 border-t border-stroke-soft">
      <input type="hidden" name="tiktok_account_id" value={tiktokAccountId} />
      <label htmlFor={`mod-email-${tiktokAccountId}`} className="caption">
        Adicionar moderador
      </label>
      <div className="flex gap-2">
        <Input id={`mod-email-${tiktokAccountId}`} name="email" type="email" placeholder="email@exemplo.com" required />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          +
        </Button>
      </div>
      {state && "error" in state && <p className="error-text">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green">{state.success}</p>}
    </form>
  );
}
