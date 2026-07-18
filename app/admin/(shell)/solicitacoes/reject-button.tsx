"use client";

import { Button } from "@/components/ui/button";

export function RejectButton({ name }: { name: string }) {
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      onClick={(e) => {
        if (!confirm(`Excluir a solicitação de ${name}? O cadastro será apagado por completo.`)) {
          e.preventDefault();
        }
      }}
    >
      Excluir
    </Button>
  );
}
