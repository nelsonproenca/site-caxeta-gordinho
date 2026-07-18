"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Backed by the native <dialog> element — free backdrop, ESC-to-close, and
// focus handling from the browser instead of hand-rolling those.
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal-overlay"
      onClose={onClose}
      onClick={(e) => {
        // The dialog element itself is the full-viewport centering frame
        // (see .modal-overlay in globals.css) — a click that lands on it
        // directly, rather than bubbling up from .modal-content, is a click
        // outside the visible card.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-content">{children}</div>
    </dialog>
  );
}
