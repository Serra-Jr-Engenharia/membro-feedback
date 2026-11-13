export interface SelfEvaluationRecord {
  id: string | number;
  user_id: string;
  week_of: string;
  created_at: string;
  rating_rendimento: number;
  rating_entregas: number;
  rating_consistencia: number;
  rating_melhoria: string;
  rating_fatores: string;
  comments?: string | null;
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(value.includes("T") ? value : `${value}T12:00:00`);
}

export function formatDate(value: string | Date): string {
  return toDate(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCycleRange(start: string | Date): string {
  const startDate = toDate(start);
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 13);
  return `Quinzena de ${formatDate(startDate)} a ${formatDate(end)}`;
}
