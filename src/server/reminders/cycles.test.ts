import { describe, expect, it } from 'vitest'
import { getCycleWindow, isReminderWindow } from './cycles'

describe('getCycleWindow', () => {
  it('calcula a janela semanal e reconhece a sexta-feira', () => {
    const cycle = getCycleWindow('Diretor', '2026-08-21', '2026-08-03')
    expect(cycle).toEqual({ type: 'weekly', key: '2026-08-17', startsOn: '2026-08-17', endsOn: '2026-08-23', reminderOn: '2026-08-21' })
    expect(isReminderWindow(cycle, '2026-08-21')).toBe(true)
    expect(isReminderWindow(cycle, '2026-08-20')).toBe(false)
    expect(isReminderWindow(cycle, '2026-08-22')).toBe(false)
  })

  it('calcula a sexta-feira da segunda semana quinzenal', () => {
    const cycle = getCycleWindow('Membro', '2026-08-14', '2026-08-03')
    expect(cycle).toEqual({ type: 'biweekly', key: '2026-08-03', startsOn: '2026-08-03', endsOn: '2026-08-16', reminderOn: '2026-08-14' })
    expect(isReminderWindow(cycle, '2026-08-14')).toBe(true)
    expect(isReminderWindow(cycle, '2026-08-03')).toBe(false)
    expect(isReminderWindow(cycle, '2026-08-09')).toBe(false)
  })

  it('avança para o próximo bloco de 14 dias', () => {
    expect(getCycleWindow('Membro', '2026-08-17', '2026-08-03').key).toBe('2026-08-17')
  })

  it('valida papel e âncora', () => {
    expect(() => getCycleWindow('Visitante', '2026-08-14', '2026-08-03')).toThrow(/role/i)
    expect(() => getCycleWindow('Membro', '2026-08-14', '2026-08-04')).toThrow(/segunda-feira/i)
  })
})
