import {
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { cn, formatBrPhone } from "@/lib/utils";

export function Field({
  label,
  hint,
  hintPosition = "bottom",
  info,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  hintPosition?: "top" | "bottom";
  info?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("field", error && "has-error", className)}>
      <label htmlFor={htmlFor} className="inline-flex items-center">
        {label}
        {hint && hintPosition === "top" && !error && <span className="hint ml-2 normal-case">{hint}</span>}
        {info && (
          <button type="button" className="field-info" data-tooltip={info} aria-label={info}>
            i
          </button>
        )}
      </label>
      {children}
      {hint && hintPosition === "bottom" && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

// Masked phone input used for every WhatsApp field — formats as the user
// types and caps input at 11 digits, so garbage like "1199999999999999" (see
// the runaway-digits bug this replaced) can't be entered.
export function PhoneInput({
  className,
  defaultValue,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [display, setDisplay] = useState(() => formatBrPhone(String(defaultValue ?? "")));

  return (
    <input
      {...props}
      type="tel"
      inputMode="numeric"
      className={cn("input", className)}
      value={display}
      onChange={(e) => {
        const formatted = formatBrPhone(e.target.value);
        setDisplay(formatted);
        onChange?.(e);
      }}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("select", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input", className)} {...props} />;
}
