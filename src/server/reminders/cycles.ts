/** Calcula as janelas semanais/quinzenais e o dia exato do lembrete. */
export type ReminderRole = "Membro" | "Diretor" | "Gestor";
export type CycleType = "weekly" | "biweekly";

export interface CycleWindow {
  /** Tipo usado na chave de idempotência do lembrete. */
  /** Data inicial do ciclo, também usada como identificador estável. */
  /** Primeiro dia incluído na consulta de avaliações. */
  /** Último dia incluído na consulta de avaliações. */
  /** Dia em que o worker deve tentar enviar o lembrete. */
  type: CycleType;
  key: string;
  startsOn: string;
  endsOn: string;
  reminderOn: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string, label: string): Date {
  if (!ISO_DATE.test(value))
    throw new Error(`${label} deve ser uma data ISO YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} deve ser uma data ISO válida`);
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Retorna a janela do ciclo do papel na data local informada.
 * Diretor e Gestor usam ciclos semanais; Membro usa blocos quinzenais
 * consecutivos ancorados na segunda-feira indicada por memberAnchorDate.
 */
export function getCycleWindow(
  role: string,
  localDate: string,
  memberAnchorDate: string,
): CycleWindow {
  if (role !== "Membro" && role !== "Diretor" && role !== "Gestor") {
    throw new Error(`role desconhecido: ${role}`);
  }
  const date = parseDate(localDate, "localDate");
  const anchor = parseDate(memberAnchorDate, "memberAnchorDate");
  if (anchor.getUTCDay() !== 1)
    throw new Error("memberAnchorDate deve ser uma segunda-feira");

  if (role === "Diretor" || role === "Gestor") {
    // A semana sempre começa na segunda-feira e termina no domingo.
    const monday = addDays(date, -((date.getUTCDay() + 6) % 7));
    const startsOn = formatDate(monday);
    const endsOn = formatDate(addDays(monday, 6));
    return {
      type: "weekly",
      key: startsOn,
      startsOn,
      endsOn,
      reminderOn: formatDate(addDays(monday, 4)),
    };
  }

  const daysSinceAnchor = Math.floor(
    (date.getTime() - anchor.getTime()) / DAY_MS,
  );
  // O bloco quinzenal é calculado a partir de uma segunda-feira fixa,
  // evitando que cada membro tenha um calendário diferente.
  const block = Math.floor(daysSinceAnchor / 14);
  const start = addDays(anchor, block * 14);
  const startsOn = formatDate(start);
  const endsOn = formatDate(addDays(start, 13));
  return {
    type: "biweekly",
    key: startsOn,
    startsOn,
    endsOn,
    reminderOn: formatDate(addDays(start, 11)),
  };
}

/** Retorna verdadeiro exclusivamente na data de término menos dois dias. */
export function isReminderWindow(
  cycle: CycleWindow,
  localDate: string,
): boolean {
  const date = parseDate(localDate, "localDate");
  parseDate(cycle.startsOn, "startsOn");
  parseDate(cycle.endsOn, "endsOn");
  return (
    formatDate(addDays(parseDate(cycle.endsOn, "endsOn"), -2)) ===
    formatDate(date)
  );
}
