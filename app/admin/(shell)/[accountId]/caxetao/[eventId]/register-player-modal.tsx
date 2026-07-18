"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { RegisterPlayerForm } from "./register-player-form";

export function RegisterPlayerModal({ eventId, accountId }: { eventId: string; accountId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="badge badge-green" onClick={() => setOpen(true)}>
        + Adicionar jogador
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic font-bold text-xl uppercase">Inscrever jogador</h2>
          <Button type="button" variant="icon" aria-label="Fechar" onClick={() => setOpen(false)}>
            ✕
          </Button>
        </div>
        <RegisterPlayerForm eventId={eventId} accountId={accountId} />
      </Modal>
    </>
  );
}
