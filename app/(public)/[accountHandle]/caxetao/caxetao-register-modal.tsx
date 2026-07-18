"use client";

import { useState } from "react";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CaxetaoRegisterForm } from "./caxetao-register-form";

export function CaxetaoRegisterModal({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        Inscreva-se
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHeader title="Inscreva-se no Caxetão" onClose={() => setOpen(false)} />
        <CaxetaoRegisterForm eventId={eventId} />
      </Modal>
    </>
  );
}
