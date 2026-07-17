import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16 text-center">
      <p className="caption">Caxeta Gordinho · Plataforma em construção</p>
      <h1 className="font-display text-5xl italic font-extrabold uppercase text-ink">
        Ranking, <span className="text-red">Caxetão</span> e Campeonatos
      </h1>
      <p className="max-w-md text-ink-dim">
        O painel administrativo e as páginas públicas de ranking ainda estão sendo construídos.
        Consulte <code className="font-mono text-sm">prd.md</code> para o escopo completo.
      </p>
      <div className="flex gap-4">
        <Link href="/admin/login" className="btn btn-primary">
          Acessar painel
        </Link>
      </div>
    </main>
  );
}
