import { describe, expect, it } from 'vitest'
import { sendReminderEmail } from './email.js'
import type { ReminderCandidate } from './types.js'

const candidate: ReminderCandidate = {
  profile: { id: 'p-1', email: 'pessoa@exemplo.com', notion_name: 'Ana <script>alert(1)</script>', user_role: 'Membro' },
  cycle: { type: 'weekly', key: '2026-08-17', startsOn: '2026-08-17', endsOn: '2026-08-23', reminderOn: '2026-08-21' },
  pendingKinds: ['peer_evaluation', 'self_evaluation'],
}
const config = { apiKey: 'secret', from: 'Equipe <noreply@exemplo.com>', appUrl: 'https://app.exemplo.com/base' }

describe('sendReminderEmail', () => {
  it('envia as duas pendências com payload seguro', async () => {
    let request: Request | undefined
    const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(String(_input), init)
      return new Response(JSON.stringify({ id: 're-1' }), { status: 201 })
    }
    await expect(sendReminderEmail(config, candidate, fetcher)).resolves.toEqual({ id: 're-1' })
    expect(request?.url).toBe('https://api.resend.com/emails')
    expect(request?.headers.get('Authorization')).toBe('Bearer secret')
    expect(request?.headers.get('Content-Type')).toBe('application/json')
    const body = JSON.parse(await request!.text())
    expect(body).toMatchObject({ from: config.from, to: ['pessoa@exemplo.com'], subject: 'Lembrete: seu ciclo de avaliação encerra em 2 dias' })
    expect(body.html).toContain('Ana &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(body.html).toContain('https://app.exemplo.com/')
    expect(body.html).toContain('Avaliação de terceiros')
    expect(body.html).toContain('Autoavaliação')
    expect(body.html).not.toContain('script>alert')
  })

  it('renderiza uma única pendência', async () => {
    const fetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.html).toContain('Autoavaliação')
      expect(body.html).not.toContain('Avaliação de terceiros')
      return new Response(JSON.stringify({ id: 're-2' }), { status: 200 })
    }
    await expect(sendReminderEmail(config, { ...candidate, pendingKinds: ['self_evaluation'] }, fetcher)).resolves.toEqual({ id: 're-2' })
  })

  it('falha sem expor a chave em resposta não-2xx', async () => {
    const fetcher = async () => new Response('provider failure details: secret', { status: 422 })
    await expect(sendReminderEmail(config, candidate, fetcher)).rejects.toThrow(/422/)
    await expect(sendReminderEmail(config, candidate, fetcher)).rejects.not.toThrow(config.apiKey)
  })
})
