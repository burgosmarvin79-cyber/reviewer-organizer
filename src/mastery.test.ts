/** Unit tests for answer matching, statistics, mastery movement, and selection. */
import { describe, expect, it, vi } from 'vitest'
import { isAcceptedAnswer, moveQuestion, normalizeAnswer, randomSelection, recordAnswer } from './mastery'
import type { Question } from './types'

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1', subjectId: 's1', prompt: 'Question?', acceptedAnswers: ['Manila'], explanation: '',
    level: 1, totalAttempts: 0, totalCorrect: 0,
    createdAt: '2026-01-01', updatedAt: '2026-01-01', ...overrides,
  }
}

describe('identification answer rules', () => {
  it('ignores capitalization and repeated whitespace', () => {
    expect(normalizeAnswer('  José   Rizal ')).toBe('josé rizal')
    expect(isAcceptedAnswer('JOSE RIZAL', ['José Rizal', 'Jose Rizal'])).toBe(true)
  })

  it('accepts any configured answer and rejects a different answer', () => {
    expect(isAcceptedAnswer('Rizal', ['José Rizal', 'Rizal'])).toBe(true)
    expect(isAcceptedAnswer('Bonifacio', ['José Rizal', 'Rizal'])).toBe(false)
  })

  it('records correctness without automatically changing levels', () => {
    expect(recordAnswer(question({ level: 3 }), false).level).toBe(3)
    expect(recordAnswer(question({ level: 2 }), true).level).toBe(2)
  })

  it('changes levels only through an explicit manual move', () => {
    expect(moveQuestion(question({ level: 2 }), 3).level).toBe(3)
  })
})

describe('random selection', () => {
  it('returns unique items without changing the input', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const items = [1, 2, 3, 4]
    const result = randomSelection(items, 3)
    expect(new Set(result).size).toBe(3)
    expect(items).toEqual([1, 2, 3, 4])
  })
})
