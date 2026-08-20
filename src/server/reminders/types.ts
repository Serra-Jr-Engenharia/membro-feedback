/** Tipos compartilhados entre cálculo de ciclos, worker, banco e e-mail. */
import type { CycleWindow } from './cycles'

export type PendingKind = 'peer_evaluation' | 'self_evaluation'

/** Perfil mínimo carregado do Supabase para participar da varredura. */
export interface ReminderProfile {
  id: string
  email: string
  notion_name: string
  user_role: 'Membro' | 'Diretor' | 'Gestor'
}

/** Resultado das consultas que indicam se cada tipo de avaliação foi concluído. */
export interface CycleEvidence {
  profile: ReminderProfile
  cycle: CycleWindow
  hasPeerEvaluation: boolean
  hasSelfEvaluation: boolean
}

/** Perfil que ainda possui pelo menos uma pendência no ciclo. */
export interface ReminderCandidate {
  profile: ReminderProfile
  cycle: CycleWindow
  pendingKinds: PendingKind[]
}
