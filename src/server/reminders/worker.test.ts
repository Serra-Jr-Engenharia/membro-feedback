import { describe, expect, it, vi } from 'vitest'
import { runReminderWorker } from './worker.js'
import type { CycleWindow } from './cycles.js'
import type { CycleEvidence, ReminderProfile } from './types.js'
import handler from '../../../api/cron/send-evaluation-reminders'

declare const process: { env: Record<string, string | undefined> }

const createClient = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({ createClient }))

const memberAnchorDate = '2026-08-03'

function profile(id: string, user_role: ReminderProfile['user_role']): ReminderProfile {
  return { id, email: `${id}@exemplo.com`, notion_name: id, user_role }
}

function evidence(profile: ReminderProfile, hasPeerEvaluation = false, hasSelfEvaluation = false): CycleEvidence {
  return {
    profile,
    cycle: {
      type: profile.user_role === 'Membro' ? 'biweekly' : 'weekly',
      key: '2026-08-03',
      startsOn: '2026-08-03',
      endsOn: '2026-08-16',
      reminderOn: '2026-08-14',
    },
    hasPeerEvaluation,
    hasSelfEvaluation,
  }
}

function dependencies(profiles: ReminderProfile[], loadEvidence = vi.fn()): Parameters<typeof runReminderWorker>[1] {
  return {
    listProfiles: vi.fn().mockResolvedValue(profiles),
    loadEvidence,
    reserve: vi.fn().mockResolvedValue(true),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue({ id: 're_1' }),
    memberAnchorDate,
  }
}

describe('runReminderWorker', () => {
  it('fora da janela não consulta evidências nem envia lembretes', async () => {
    const loadEvidence = vi.fn()
    const deps = dependencies([profile('diretor', 'Diretor'), profile('membro', 'Membro')], loadEvidence)

    await expect(runReminderWorker(new Date('2026-08-20T15:00:00Z'), deps)).resolves.toEqual({
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    })

    expect(loadEvidence).not.toHaveBeenCalled()
    expect(deps.reserve).not.toHaveBeenCalled()
    expect(deps.sendEmail).not.toHaveBeenCalled()
  })

  it('agrupa perfis semanais e quinzenais em suas próprias janelas elegíveis', async () => {
    const director = profile('diretor', 'Diretor')
    const manager = profile('gestor', 'Gestor')
    const member = profile('membro', 'Membro')
    const loadEvidence = vi.fn(async (cycle: CycleWindow, group: ReminderProfile[]) => group.map((item) => ({
      profile: item,
      cycle,
      hasPeerEvaluation: item.id !== 'membro',
      hasSelfEvaluation: true,
    })))
    const deps = dependencies([director, manager, member], loadEvidence)

    await expect(runReminderWorker(new Date('2026-08-14T15:00:00Z'), deps)).resolves.toEqual({
      scanned: 3,
      sent: 1,
      skipped: 0,
      failed: 0,
    })

    expect(loadEvidence).toHaveBeenCalledTimes(2)
    expect(loadEvidence).toHaveBeenNthCalledWith(1, {
      type: 'weekly',
      key: '2026-08-10',
      startsOn: '2026-08-10',
      endsOn: '2026-08-16',
      reminderOn: '2026-08-14',
    }, [director, manager])
    expect(loadEvidence).toHaveBeenNthCalledWith(2, {
      type: 'biweekly',
      key: '2026-08-03',
      startsOn: '2026-08-03',
      endsOn: '2026-08-16',
      reminderOn: '2026-08-14',
    }, [member])
    expect(deps.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ profile: member }))
  })

  it('envia somente para Diretor, Membro e Gestor pendentes e ignora uma reserva prévia', async () => {
    const pendingDirector = profile('diretor-pendente', 'Diretor')
    const completeDirector = profile('diretor-completo', 'Diretor')
    const pendingMember = profile('membro-pendente', 'Membro')
    const completeMember = profile('membro-completo', 'Membro')
    const pendingManager = profile('gestor-pendente', 'Gestor')
    const previouslyReserved = profile('reserva-anterior', 'Diretor')
    const completedProfiles = new Set([completeDirector.id, completeMember.id])
    const loadEvidence = vi.fn(async (cycle: CycleWindow, group: ReminderProfile[]) => group.map((item) => ({
      profile: item,
      cycle,
      hasPeerEvaluation: completedProfiles.has(item.id),
      hasSelfEvaluation: completedProfiles.has(item.id),
    })))
    const deps = dependencies([
      pendingDirector,
      completeDirector,
      pendingMember,
      completeMember,
      pendingManager,
      previouslyReserved,
    ], loadEvidence)
    vi.mocked(deps.reserve).mockImplementation(async (candidate) => candidate.profile.id !== previouslyReserved.id)
    vi.mocked(deps.sendEmail).mockImplementation(async (candidate) => ({ id: `re_${candidate.profile.id}` }))

    await expect(runReminderWorker(new Date('2026-08-14T15:00:00Z'), deps)).resolves.toEqual({
      scanned: 6,
      sent: 3,
      skipped: 1,
      failed: 0,
    })

    expect(deps.sendEmail).toHaveBeenCalledTimes(3)
    expect(deps.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ profile: pendingDirector }))
    expect(deps.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ profile: pendingMember }))
    expect(deps.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ profile: pendingManager }))
    expect(deps.sendEmail).not.toHaveBeenCalledWith(expect.objectContaining({ profile: completeDirector }))
    expect(deps.sendEmail).not.toHaveBeenCalledWith(expect.objectContaining({ profile: completeMember }))
    expect(deps.sendEmail).not.toHaveBeenCalledWith(expect.objectContaining({ profile: previouslyReserved }))
  })

  it('envia pendências e contabiliza reserva recusada e falha sem interromper os demais', async () => {
    const sentProfile = profile('enviado', 'Membro')
    const reservedProfile = profile('reservado', 'Membro')
    const failedProfile = profile('falhou', 'Membro')
    const completeProfile = profile('completo', 'Membro')
    const loadEvidence = vi.fn().mockResolvedValue([
      evidence(sentProfile),
      evidence(reservedProfile),
      evidence(failedProfile),
      evidence(completeProfile, true, true),
    ])
    const deps = dependencies([sentProfile, reservedProfile, failedProfile, completeProfile], loadEvidence)
    vi.mocked(deps.reserve)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
    vi.mocked(deps.sendEmail)
      .mockResolvedValueOnce({ id: 're_sent' })
      .mockRejectedValueOnce(new Error('destinatário inválido'))

    await expect(runReminderWorker(new Date('2026-08-14T15:00:00Z'), deps)).resolves.toEqual({
      scanned: 4,
      sent: 1,
      skipped: 1,
      failed: 1,
    })

    expect(deps.markSent).toHaveBeenCalledWith(expect.objectContaining({ profile: sentProfile }), 're_sent')
    expect(deps.markFailed).toHaveBeenCalledWith(expect.objectContaining({ profile: failedProfile }), 'destinatário inválido')
    expect(deps.sendEmail).toHaveBeenCalledTimes(2)
  })

  it('propaga falha ao registrar um envio já entregue', async () => {
    const member = profile('membro', 'Membro')
    const deps = dependencies([member], vi.fn().mockResolvedValue([evidence(member)]))
    vi.mocked(deps.markSent).mockRejectedValueOnce(new Error('falha ao gravar sucesso'))

    await expect(runReminderWorker(new Date('2026-08-14T15:00:00Z'), deps)).rejects.toThrow('falha ao gravar sucesso')

    expect(deps.markFailed).not.toHaveBeenCalled()
  })
})

function response() {
  const state = { statusCode: 200, body: '' }
  return {
    state,
    get statusCode() {
      return state.statusCode
    },
    set statusCode(value: number) {
      state.statusCode = value
    },
    setHeader: vi.fn(),
    end: vi.fn((body = '') => { state.body = body }),
  }
}

function configureEnvironment() {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.SUPABASE_URL = 'https://project.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  process.env.RESEND_API_KEY = 'resend-key'
  process.env.RESEND_FROM_EMAIL = 'Equipe <lembretes@exemplo.com>'
  process.env.APP_URL = 'https://app.exemplo.com'
  process.env.MEMBER_CYCLE_ANCHOR_DATE = memberAnchorDate
}

describe('send-evaluation-reminders handler', () => {
  it('aceita GET autorizado e responde o resultado do worker sem acessar provedores reais', async () => {
    configureEnvironment()
    createClient.mockReturnValue({
      from: () => ({
        select: () => ({
          not: () => ({
            neq: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    })
    const res = response()

    await handler({ method: 'GET', headers: { authorization: 'Bearer cron-secret' } } as never, res as never)

    expect(res.state.statusCode).toBe(200)
    expect(JSON.parse(res.state.body)).toEqual({ scanned: 0, sent: 0, skipped: 0, failed: 0 })
    expect(createClient).toHaveBeenCalledWith('https://project.supabase.co', 'service-role-key')
  })

  it('rejeita requisição sem segredo de cron', async () => {
    configureEnvironment()
    const res = response()

    await handler({ method: 'GET', headers: {} } as never, res as never)

    expect(res.state.statusCode).toBe(401)
  })

  it('rejeita requisição não autorizada antes de validar outras variáveis do servidor', async () => {
    configureEnvironment()
    delete process.env.RESEND_API_KEY
    createClient.mockClear()
    const res = response()

    await handler({ method: 'GET', headers: {} } as never, res as never)

    expect(res.state.statusCode).toBe(401)
    expect(res.state.body).not.toContain('cron-secret')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('rejeita método diferente de GET', async () => {
    configureEnvironment()
    const res = response()

    await handler({ method: 'POST', headers: { authorization: 'Bearer cron-secret' } } as never, res as never)

    expect(res.state.statusCode).toBe(405)
  })

  it('falha sem expor variáveis quando a configuração obrigatória está ausente', async () => {
    configureEnvironment()
    delete process.env.RESEND_API_KEY
    const res = response()

    await handler({ method: 'GET', headers: { authorization: 'Bearer cron-secret' } } as never, res as never)

    expect(res.state.statusCode).toBe(500)
    expect(res.state.body).not.toContain('service-role-key')
    expect(res.state.body).not.toContain('cron-secret')
  })
})
