"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthActionState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? signIn : signUp;
  const initialState: AuthActionState = initialError ? { error: initialError } : null;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      {mode === "signup" && (
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" type="text" required placeholder="Seu nome" />
        </Field>
      )}
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
      </Field>
      <Field label="Senha" htmlFor="password">
        <Input id="password" name="password" type="password" required minLength={6} />
      </Field>

      {state && "error" in state && <p className="error-text">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </Button>

      <button
        type="button"
        className="btn btn-ghost btn-sm self-start"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
      </button>
    </form>
  );
}
