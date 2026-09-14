import { describe, expect, it } from 'vitest'
import { findPendingCandidate, loadCycleEvidence } from './candidates.js'
import type { CycleEvidence, ReminderProfile } from './types.js'

const cycle = {
  type: 'weekly' as const,
  key: '2026-08-17',
  startsOn: '2026-08-17',
  endsOn: '2026-08-23',
  reminderOn: '2026-08-21',
}

function profile(user_role: ReminderProfile['user_role']): ReminderProfile {
  return { id: 'profile-1', email: 'pessoa@exemplo.com', notion_name: 'Pessoa', user_role }
}

function evidence(
  user_role: ReminderProfile['user_role'],
  hasPeerEvaluation: boolean,
  hasSelfEvaluation: boolean,
): CycleEvidence {
  return { profile: profile(user_role), cycle, hasPeerEvaluation, hasSelfEvaluation }
}

describe('findPendingCandidate', () => {
  it('identifica as duas pendências de um diretor sem evidência', () => {
    expect(findPendingCandidate(evidence('Diretor', false, false))).toMatchObject({
      pendingKinds: ['peer_evaluation', 'self_evaluation'],
    })
  })

  it('identifica somente a autoavaliação pendente de um diretor', () => {
    expect(findPendingCandidate(evidence('Diretor', true, false))).toMatchObject({
      pendingKinds: ['self_evaluation'],
    })
  })

  it('não seleciona diretor com obrigações completas', () => {
    expect(findPendingCandidate(evidence('Diretor', true, true))).toBeNull()
  })

  it('identifica somente a avaliação de terceiros pendente de um gestor', () => {
    expect(findPendingCandidate(evidence('Gestor', false, false))).toMatchObject({
      pendingKinds: ['peer_evaluation'],
    })
  })

  it('identifica somente a autoavaliação pendente de um membro', () => {
    expect(findPendingCandidate(evidence('Membro', true, false))).toMatchObject({
      pendingKinds: ['self_evaluation'],
    })
  })

  it('não exige autoavaliação de gestor com avaliação de terceiros concluída', () => {
    expect(findPendingCandidate(evidence('Gestor', true, false))).toBeNull()
  })

  it('não seleciona membro com obrigações completas', () => {
    expect(findPendingCandidate(evidence('Membro', true, true))).toBeNull()
  })
})

describe('loadCycleEvidence', () => {
  it('consulta avaliações e autoavaliações pelos perfis e intervalo do ciclo', async () => {
    const calls: Array<[string, ...unknown[]]> = []
    const query = (data: unknown[]) => ({
      select: (columns: string) => {
        calls.push(['select', columns])
        return query(data)
      },
      in: (column: string, values: string[]) => {
        calls.push(['in', column, values])
        return query(data)
      },
      gte: (column: string, value: string) => {
        calls.push(['gte', column, value])
        return query(data)
      },
      lte: (column: string, value: string) => {
        calls.push(['lte', column, value])
        return Promise.resolve({ data, error: null })
      },
    })
    const supabase = {
      from: (table: string) => {
        calls.push(['from', table])
        return query(table === 'evaluations' ? [{ director_id: 'director-1' }] : [{ user_id: 'member-1' }])
      },
    }
    const profiles: ReminderProfile[] = [
      { id: 'director-1', email: 'diretor@exemplo.com', notion_name: 'Diretor', user_role: 'Diretor' },
      { id: 'member-1', email: 'membro@exemplo.com', notion_name: 'Membro', user_role: 'Membro' },
    ]

    await expect(loadCycleEvidence(supabase as never, cycle, profiles)).resolves.toEqual([
      { profile: profiles[0], cycle, hasPeerEvaluation: true, hasSelfEvaluation: false },
      { profile: profiles[1], cycle, hasPeerEvaluation: false, hasSelfEvaluation: true },
    ])
    expect(calls).toEqual([
      ['from', 'evaluations'],
      ['select', 'director_id'],
      ['in', 'director_id', ['director-1', 'member-1']],
      ['gte', 'week_of', '2026-08-17'],
      ['lte', 'week_of', '2026-08-23'],
      ['from', 'self_evaluations'],
      ['select', 'user_id'],
      ['in', 'user_id', ['director-1', 'member-1']],
      ['gte', 'week_of', '2026-08-17'],
      ['lte', 'week_of', '2026-08-23'],
    ])
  })

  it('propaga erro retornado pelo Supabase', async () => {
    const expectedError = new Error('falha no banco')
    const query = (result: { data: unknown[]; error: Error | null }) => ({
      select: () => query(result),
      in: () => query(result),
      gte: () => query(result),
      lte: () => Promise.resolve(result),
    })
    const supabase = {
      from: (table: string) => query({
        data: [],
        error: table === 'evaluations' ? expectedError : null,
      }),
    }

    await expect(loadCycleEvidence(supabase as never, cycle, [profile('Diretor')])).rejects.toBe(expectedError)
  })
})
