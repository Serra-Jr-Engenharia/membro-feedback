/** Persiste reservas e resultados para garantir idempotência e rastreabilidade. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CycleType } from './cycles.js'
import type { ReminderCandidate } from './types.js'

const MAX_ERROR_MESSAGE_LENGTH = 1_000

export interface ReminderLogKey {
  userId: string
  cycleType: CycleType
  cycleKey: string
  channel: 'email'
}

/**
 * Cria a reserva idempotente de um lembrete antes do envio do e-mail.
 */
export async function reserveReminder(
  supabase: SupabaseClient,
  candidate: ReminderCandidate,
): Promise<boolean> {
  // A constraint UNIQUE transforma uma segunda tentativa no mesmo ciclo em skip.
  const { error } = await supabase.from('reminder_logs').insert({
    user_id: candidate.profile.id,
    cycle_type: candidate.cycle.type,
    cycle_key: candidate.cycle.key,
    channel: 'email',
    status: 'processing',
    pending_kinds: candidate.pendingKinds,
  })

  if (!error) return true
  if (error.code === '23505') return false
  throw error
}

/**
 * Registra que o lembrete reservado foi enviado com sucesso pelo Resend.
 */
export async function markReminderSent(
  supabase: SupabaseClient,
  key: ReminderLogKey,
  resendEmailId: string,
): Promise<void> {
  // O ID retornado pelo Resend é salvo para auditoria e suporte operacional.
  const { error } = await supabase
    .from('reminder_logs')
    .update({ status: 'sent', sent_at: new Date().toISOString(), resend_email_id: resendEmailId })
    .eq('user_id', key.userId)
    .eq('cycle_type', key.cycleType)
    .eq('cycle_key', key.cycleKey)
    .eq('channel', key.channel)

  if (error) throw error
}

/**
 * Registra uma falha de envio sem expor caracteres de controle ou texto excessivo.
 */
export async function markReminderFailed(
  supabase: SupabaseClient,
  key: ReminderLogKey,
  message: string,
): Promise<void> {
  // Falhas ficam registradas para diagnóstico, sem liberar um novo envio automático.
  const { error } = await supabase
    .from('reminder_logs')
    .update({ status: 'failed', error_message: sanitizeErrorMessage(message) })
    .eq('user_id', key.userId)
    .eq('cycle_type', key.cycleType)
    .eq('cycle_key', key.cycleKey)
    .eq('channel', key.channel)

  if (error) throw error
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/\p{Cc}/gu, '').trim().slice(0, MAX_ERROR_MESSAGE_LENGTH)
}
