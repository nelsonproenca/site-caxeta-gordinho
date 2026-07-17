import { LoginForm } from "./login-form";
import { authErrorMessage } from "@/lib/auth-errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="caption">Caxeta Gordinho · Painel</p>
        <h1 className="font-display text-3xl italic font-extrabold uppercase">Acesso administrativo</h1>
      </div>
      <LoginForm initialError={authErrorMessage(error)} />
    </main>
  );
}
