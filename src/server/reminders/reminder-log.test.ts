import { describe, expect, it } from 'vitest'
import { markReminderFailed, markReminderSent, reserveReminder } from './reminder-log.js'
import type { ReminderCandidate } from './types.js'

const candidate: ReminderCandidate = {
  profile: { id: '11111111-1111-1111-1111-111111111111', email: 'pessoa@exemplo.com', notion_name: 'Pessoa', user_role: 'Membro' },
  cycle: { type: 'weekly', key: '2026-08-17', startsOn: '2026-08-17', endsOn: '2026-08-23', reminderOn: '2026-08-21' },
  pendingKinds: ['peer_evaluation', 'self_evaluation'],
}

const key = {
  userId: candidate.profile.id,
  cycleType: candidate.cycle.type,
  cycleKey: candidate.cycle.key,
  channel: 'email' as const,
}

type RecordedCall = [string, ...unknown[]]

function insertSupabase(error: unknown, calls: RecordedCall[]) {
  return {
    from: (table: string) => {
      calls.push(['from', table])
      return {
        insert: (values: unknown) => {
          calls.push(['insert', values])
          return Promise.resolve({ error })
        },
      }
    },
  }
}

function updateSupabase(calls: RecordedCall[]) {
  return {
    from: (table: string) => {
      calls.push(['from', table])
      return {
        update: (values: unknown) => {
          calls.push(['update', values])
          return {
            eq: (column: string, value: unknown) => {
              calls.push(['eq', column, value])
              return {
                eq: (nextColumn: string, nextValue: unknown) => {
                  calls.push(['eq', nextColumn, nextValue])
                  return {
                    eq: (lastColumn: string, lastValue: unknown) => {
                      calls.push(['eq', lastColumn, lastValue])
                      return {
                        eq: (channelColumn: string, channelValue: unknown) => {
                          calls.push(['eq', channelColumn, channelValue])
                          return Promise.resolve({ error: null })
                        },
                      }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('reserveReminder', () => {
  it('reserva o primeiro lembrete com seus dados de ciclo e pendências', async () => {
    const calls: RecordedCall[] = []

    await expect(reserveReminder(insertSupabase(null, calls) as never, candidate)).resolves.toBe(true)

    expect(calls).toEqual([
      ['from', 'reminder_logs'],
      ['insert', {
        user_id: '11111111-1111-1111-1111-111111111111',
        cycle_type: 'weekly',
        cycle_key: '2026-08-17',
        channel: 'email',
        status: 'processing',
        pending_kinds: ['peer_evaluation', 'self_evaluation'],
      }],
    ])
  })

  it('não reserva novamente quando a chave única já existe', async () => {
    const calls: RecordedCall[] = []
    const duplicate = { code: '23505', message: 'duplicate key value violates unique constraint' }

    await expect(reserveReminder(insertSupabase(duplicate, calls) as never, candidate)).resolves.toBe(false)
  })

  it('propaga erro que não é violação de unicidade', async () => {
    const expectedError = { code: '42501', message: 'permission denied' }

    await expect(reserveReminder(insertSupabase(expectedError, []) as never, candidate)).rejects.toBe(expectedError)
  })
})

describe('markReminderSent', () => {
  it('marca o lembrete como enviado usando a chave completa', async () => {
    const calls: RecordedCall[] = []

    await expect(markReminderSent(updateSupabase(calls) as never, key, 're_123')).resolves.toBeUndefined()

    expect(calls).toHaveLength(6)
    expect(calls.slice(0, 2)).toEqual([
      ['from', 'reminder_logs'],
      ['update', { status: 'sent', resend_email_id: 're_123', sent_at: expect.any(String) }],
    ])
    expect(calls.slice(2)).toEqual([
      ['eq', 'user_id', key.userId],
      ['eq', 'cycle_type', key.cycleType],
      ['eq', 'cycle_key', key.cycleKey],
      ['eq', 'channel', key.channel],
    ])
  })
})

describe('markReminderFailed', () => {
  it('marca a falha usando a chave completa e limita a mensagem', async () => {
    const calls: RecordedCall[] = []
    const message = `  falha\u0000${'x'.repeat(1_100)}  `

    await expect(markReminderFailed(updateSupabase(calls) as never, key, message)).resolves.toBeUndefined()

    expect(calls).toHaveLength(6)
    expect(calls[1]).toEqual(['update', { status: 'failed', error_message: `falha${'x'.repeat(995)}` }])
    expect(calls.slice(2)).toEqual([
      ['eq', 'user_id', key.userId],
      ['eq', 'cycle_type', key.cycleType],
      ['eq', 'cycle_key', key.cycleKey],
      ['eq', 'channel', key.channel],
    ])
  })
})
