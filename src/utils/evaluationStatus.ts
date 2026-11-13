const CYCLE_ANCHOR_DATE =
  import.meta.env.VITE_MEMBER_CYCLE_ANCHOR_DATE ?? "2026-08-17";

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function parseAnchor(value: string): Date {
  if (!ISO_DATE.test(value)) {
    throw new Error("VITE_MEMBER_CYCLE_ANCHOR_DATE deve ser uma data ISO YYYY-MM-DD");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("VITE_MEMBER_CYCLE_ANCHOR_DATE deve ser uma data válida");
  }
  if (date.getUTCDay() !== 1) {
    throw new Error("VITE_MEMBER_CYCLE_ANCHOR_DATE deve ser uma segunda-feira");
  }
  return date;
}

const ANCHOR = parseAnchor(CYCLE_ANCHOR_DATE);

function getCycleStartISO(): string {
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceAnchor = Math.floor(
    (todayUTC - ANCHOR.getTime()) / DAY_MS
  );
  const block = Math.floor(daysSinceAnchor / 14);
  return new Date(ANCHOR.getTime() + block * 14 * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function isoToLocalDate(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

/** Início do bloco quinzenal atual, igual ao usado nos lembretes. */
export function getCycleStartDate(): Date {
  return isoToLocalDate(getCycleStartISO());
}

/** Fim do bloco quinzenal atual (13 dias após o início). */
export function getCycleEndDate(): Date {
  const end = getCycleStartDate();
  end.setDate(end.getDate() + 13);
  return end;
}

/** Início do bloco quinzenal no formato YYYY-MM-DD. */
export function getCycleDateISO(): string {
  return getCycleStartISO();
}

export function getEvaluationStatus(
  lastEvalDateStr: string | null
): "pending" | "up-to-date" {
  if (!lastEvalDateStr) return "pending";
  return new Date(lastEvalDateStr) >= getCycleStartDate()
    ? "up-to-date"
    : "pending";
}
