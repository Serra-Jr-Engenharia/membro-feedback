/** Endpoint protegido pelo cron da Vercel que inicia o worker de lembretes. */
import { createClient } from '@supabase/supabase-js'
import { loadCycleEvidence } from '../../src/server/reminders/candidates.js'
import { sendReminderEmail } from '../../src/server/reminders/email.js'
import { markReminderFailed, markReminderSent, reserveReminder } from '../../src/server/reminders/reminder-log.js'
import type { ReminderLogKey } from '../../src/server/reminders/reminder-log.js'
import type { ReminderCandidate, ReminderProfile } from '../../src/server/reminders/types.js'
import { runReminderWorker } from '../../src/server/reminders/worker.js'

declare const process: { env: Record<string, string | undefined> }

interface CronRequest {
  method?: string
  headers: { authorization?: string | string[] | undefined }
}

interface CronResponse {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

interface ReminderEnvironment {
  supabaseUrl: string
  supabaseServiceRoleKey: string
  resendApiKey: string
  resendFromEmail: string
  appUrl: string
  memberCycleAnchorDate: string
}

/** Lê as configurações obrigatórias sem expor segredos na resposta. */
function readEnvironment(): ReminderEnvironment | null {
  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    APP_URL,
    MEMBER_CYCLE_ANCHOR_DATE,
  } = process.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !RESEND_FROM_EMAIL || !APP_URL || !MEMBER_CYCLE_ANCHOR_DATE) {
    return null
  }

  return {
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: RESEND_API_KEY,
    resendFromEmail: RESEND_FROM_EMAIL,
    appUrl: APP_URL,
    memberCycleAnchorDate: MEMBER_CYCLE_ANCHOR_DATE,
  }
}

/** Escreve respostas JSON padronizadas para o endpoint serverless. */
function writeJson(response: CronResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

/** Monta a chave usada para reservar/atualizar um lembrete no banco. */
function logKey(candidate: ReminderCandidate): ReminderLogKey {
  return {
    userId: candidate.profile.id,
    cycleType: candidate.cycle.type,
    cycleKey: candidate.cycle.key,
    channel: 'email',
  }
}

/** Valida a chamada do cron e executa uma varredura completa. */
export default async function handler(request: CronRequest, response: CronResponse): Promise<void> {
  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'Método não permitido.' })
    return
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.authorization !== `Bearer ${cronSecret}`) {
    writeJson(response, 401, { error: 'Não autorizado.' })
    return
  }

  const environment = readEnvironment()
  if (!environment) {
    writeJson(response, 500, { error: 'Configuração do servidor incompleta.' })
    return
  }

  try {
    // O client usa a Service Role somente dentro da função protegida do cron.
    const supabase = createClient(environment.supabaseUrl, environment.supabaseServiceRoleKey)
    const result = await runReminderWorker(new Date(), {
      listProfiles: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, notion_name, user_role')
          .not('email', 'is', null)
          .neq('email', '')
          .in('user_role', ['Membro', 'Diretor', 'Gestor'])
        if (error) throw error
        return (data ?? []) as ReminderProfile[]
      },
      loadEvidence: (cycle, profiles) => loadCycleEvidence(supabase, cycle, profiles),
      reserve: (candidate) => reserveReminder(supabase, candidate),
      markSent: (candidate, resendEmailId) => markReminderSent(supabase, logKey(candidate), resendEmailId),
      markFailed: (candidate, message) => markReminderFailed(supabase, logKey(candidate), message),
      sendEmail: (candidate) => sendReminderEmail({
        apiKey: environment.resendApiKey,
        from: environment.resendFromEmail,
        appUrl: environment.appUrl,
      }, candidate),
      memberAnchorDate: environment.memberCycleAnchorDate,
    })

    writeJson(response, 200, result)
  } catch {
    writeJson(response, 500, { error: 'Erro interno ao processar lembretes.' })
  }
}
