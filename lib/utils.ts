import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Strips ALL leading '@' (not just one) so "@@user" and "@user" both
// normalize to "user" — mirrors the DB-level normalization in the players
// migration (ltrim(handle, '@')), which also strips every leading '@'.
export function normalizeHandle(handle: string) {
  return handle.trim().toLowerCase().replace(/^@+/, "");
}

// Start of "today" in America/Sao_Paulo, as an ISO instant. Brazil has had
// no DST since 2019, so the offset is a fixed UTC-3 — local midnight is
// always 03:00 UTC. Used to detect live_sessions left open past their day.
export function startOfTodayInSaoPaulo(): string {
  const todayYmd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${todayYmd}T03:00:00.000Z`;
}

// Formats an ISO timestamp as dd/MM/yyyy HH:mm in the America/Sao_Paulo
// timezone, built from formatToParts (not a raw Intl locale string) so the
// separators are exact regardless of runtime locale/ICU quirks.
export function formatDateTime(iso: string, timeZone = "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

// Formats digits as a Brazilian phone number: (11) 91234-5678 (11 digits,
// mobile with the leading 9) or (11) 1234-5678 (10 digits, landline).
// Used to mask every WhatsApp field so users can't paste/type runaway digits.
export function formatBrPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
