/** Monta e envia o e-mail transacional de lembrete pelo Resend. */
import type { ReminderCandidate, PendingKind } from './types'

export interface EmailConfig {
  /** Segredos e origem usados somente no backend/serverless. */
  apiKey: string
  from: string
  appUrl: string
}

const labels: Record<PendingKind, string> = {
  peer_evaluation: 'Avaliação de terceiros',
  self_evaluation: 'Autoavaliação',
}

/** Escapa texto inserido em HTML para impedir injeção de marcação. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

/** Envia ao Resend um lembrete de ciclo para o perfil candidato. */
export async function sendReminderEmail(
  config: EmailConfig,
  candidate: ReminderCandidate,
  fetcher: typeof fetch = fetch,
): Promise<{ id: string }> {
  const html = [
    `<p>Olá, ${escapeHtml(candidate.profile.notion_name)}!</p>`,
    '<p>Seu ciclo de avaliação encerra em 2 dias. Ainda falta concluir:</p>',
    `<ul>${candidate.pendingKinds.map((kind) => `<li>${labels[kind]}</li>`).join('')}</ul>`,
    `<p><a href="${escapeHtml(new URL('/', config.appUrl).toString())}">Acessar o aplicativo</a></p>`,
  ].join('')

  // O fetcher é injetável para os testes não dispararem e-mails reais.
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: config.from,
      to: [candidate.profile.email],
      subject: 'Lembrete: seu ciclo de avaliação encerra em 2 dias',
      html,
    }),
  })

  if (!response.ok) {
    const body = (await response.text()).slice(0, 500).split(config.apiKey).join('[REDACTED]')
    throw new Error(`Falha ao enviar lembrete (status ${response.status}): ${body}`)
  }

  const result = (await response.json()) as { id?: unknown }
  if (typeof result.id !== 'string') throw new Error('Resposta do provedor sem identificador de envio')
  return { id: result.id }
}
