/** Orquestra a varredura diária, envio, idempotência e contadores da execução. */
import { findPendingCandidate } from "./candidates";
import { getCycleWindow, isReminderWindow } from "./cycles";
import type { CycleWindow } from "./cycles";
import type {
  CycleEvidence,
  ReminderCandidate,
  ReminderProfile,
} from "./types";

export interface ReminderRunResult {
  /** Perfis cujo ciclo está na janela de lembrete. */
  /** E-mails aceitos pelo provedor e marcados como enviados. */
  /** Candidatos já reservados anteriormente. */
  /** Falhas de envio registradas no log. */
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
}

export interface ReminderDependencies {
  listProfiles: () => Promise<ReminderProfile[]>;
  loadEvidence: (
    cycle: CycleWindow,
    profiles: ReminderProfile[],
  ) => Promise<CycleEvidence[]>;
  reserve: (candidate: ReminderCandidate) => Promise<boolean>;
  markSent: (
    candidate: ReminderCandidate,
    resendEmailId: string,
  ) => Promise<void>;
  markFailed: (candidate: ReminderCandidate, message: string) => Promise<void>;
  sendEmail: (candidate: ReminderCandidate) => Promise<{ id: string }>;
  memberAnchorDate: string;
}

function getSaoPauloDate(now: Date): string {
  // O cron roda em UTC, mas as regras de negócio usam o calendário brasileiro.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Executa o processamento usando dependências injetadas para facilitar testes. */
export async function runReminderWorker(
  now: Date,
  dependencies: ReminderDependencies,
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    scanned: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };
  const localDate = getSaoPauloDate(now);
  const profiles = await dependencies.listProfiles();
  const groups = new Map<
    string,
    { cycle: CycleWindow; profiles: ReminderProfile[] }
  >();

  for (const profile of profiles) {
    const cycle = getCycleWindow(
      profile.user_role,
      localDate,
      dependencies.memberAnchorDate,
    );
    if (!isReminderWindow(cycle, localDate)) continue;

    // Agrupar reduz as consultas ao Supabase quando vários perfis compartilham o ciclo.
    const key = `${cycle.type}:${cycle.key}`;
    const group = groups.get(key);
    if (group) {
      group.profiles.push(profile);
    } else {
      groups.set(key, { cycle, profiles: [profile] });
    }
    result.scanned += 1;
  }

  for (const { cycle, profiles: groupProfiles } of groups.values()) {
    const evidence = await dependencies.loadEvidence(cycle, groupProfiles);
    for (const item of evidence) {
      const candidate = findPendingCandidate(item);
      if (!candidate) continue;

      if (!(await dependencies.reserve(candidate))) {
        result.skipped += 1;
        continue;
      }

      let delivery: { id: string };
      try {
        // Somente a falha do provedor vira failed; erro ao persistir sent propaga.
        delivery = await dependencies.sendEmail(candidate);
      } catch (error) {
        await dependencies.markFailed(candidate, errorMessage(error));
        result.failed += 1;
        continue;
      }

      await dependencies.markSent(candidate, delivery.id);
      result.sent += 1;
    }
  }

  return result;
}
