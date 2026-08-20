/** Consulta evidências no Supabase e transforma pendências em candidatos a lembrete. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CycleWindow } from './cycles.js'
import type { CycleEvidence, PendingKind, ReminderCandidate, ReminderProfile } from './types.js'

/** Decide quais avaliações ainda faltam para um perfil no ciclo informado. */
export function findPendingCandidate(evidence: CycleEvidence): ReminderCandidate | null {
  const pendingKinds: PendingKind[] = []

  // A ausência de uma linha em evaluations indica pendência de avaliação de terceiros.
  if (!evidence.hasPeerEvaluation) pendingKinds.push('peer_evaluation')
  // Gestores não possuem autoavaliação nesta primeira versão do fluxo.
  if ((evidence.profile.user_role === 'Membro' || evidence.profile.user_role === 'Diretor') && !evidence.hasSelfEvaluation) {
    pendingKinds.push('self_evaluation')
  }

  return pendingKinds.length === 0
    ? null
    : { profile: evidence.profile, cycle: evidence.cycle, pendingKinds }
}

/** Carrega, em paralelo, avaliações de terceiros e autoavaliações do ciclo. */
export async function loadCycleEvidence(
  supabase: SupabaseClient,
  cycle: CycleWindow,
  profiles: ReminderProfile[],
): Promise<CycleEvidence[]> {
  const profileIds = profiles.map((profile) => profile.id)
  // As duas consultas usam o mesmo intervalo do ciclo e rodam em paralelo.
  const [{ data: evaluations, error: evaluationsError }, { data: selfEvaluations, error: selfEvaluationsError }] = await Promise.all([
    supabase
      .from('evaluations')
      .select('director_id')
      .in('director_id', profileIds)
      .gte('week_of', cycle.startsOn)
      .lte('week_of', cycle.endsOn),
    supabase
      .from('self_evaluations')
      .select('user_id')
      .in('user_id', profileIds)
      .gte('week_of', cycle.startsOn)
      .lte('week_of', cycle.endsOn),
  ])

  if (evaluationsError) throw evaluationsError
  if (selfEvaluationsError) throw selfEvaluationsError

  const peerEvaluationIds = new Set((evaluations ?? []).map((evaluation) => evaluation.director_id))
  const selfEvaluationIds = new Set((selfEvaluations ?? []).map((evaluation) => evaluation.user_id))

  // Sets permitem testar rapidamente se cada perfil possui registro no período.
  return profiles.map((profile) => ({
    profile,
    cycle,
    hasPeerEvaluation: peerEvaluationIds.has(profile.id),
    hasSelfEvaluation: selfEvaluationIds.has(profile.id),
  }))
}
