import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Modal, ModalHeader } from "./modal";
import { Button } from "./button";
import { Field, Input } from "./field";

function ModalDemo({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHeader title="Inscrever jogador" onClose={() => setOpen(false)} />
        <div className="flex flex-wrap items-end gap-4">
          <Field label="@tiktok" htmlFor="modal-handle" className="w-48">
            <Input id="modal-handle" placeholder="usuario" />
          </Field>
          <Field label="Nome (se novo)" htmlFor="modal-name" className="w-48">
            <Input id="modal-name" placeholder="opcional" />
          </Field>
          <Button type="button" variant="outline">
            Inscrever
          </Button>
        </div>
      </Modal>
    </>
  );
}

const meta = {
  title: "UI/Modal",
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Click "Abrir modal" — Storybook's own iframe styling can't be captured by
// a starts-open story reliably (the <dialog> promotes to the top layer),
// so this defaults closed; use OpenByDefault to see it rendered immediately.
export const Default: Story = {
  render: () => <ModalDemo startOpen={false} />,
};

export const OpenByDefault: Story = {
  render: () => <ModalDemo startOpen />,
};
