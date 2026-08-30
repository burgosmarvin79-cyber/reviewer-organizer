import { describe, expect, it, vi } from 'vitest'
import { applyAnswer, randomSelection } from './mastery'
import type { Question } from './types'

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1', subjectId: 's1', prompt: 'Question?', choices: [], correctChoiceId: 'c1', explanation: '',
    level: 1, correctStreak: 0, totalAttempts: 0, totalCorrect: 0,
    createdAt: '2026-01-01', updatedAt: '2026-01-01', ...overrides,
  }
}

describe('mastery rules', () => {
  it('promotes after three consecutive correct answers', () => {
    const result = applyAnswer(question({ level: 2, correctStreak: 2 }), true)
    expect(result.level).toBe(3)
    expect(result.correctStreak).toBe(0)
  })

  it('demotes one level and resets the streak after an incorrect answer', () => {
    const result = applyAnswer(question({ level: 3, correctStreak: 2 }), false)
    expect(result.level).toBe(2)
    expect(result.correctStreak).toBe(0)
  })

  it('never demotes below level one or promotes above level four', () => {
    expect(applyAnswer(question({ level: 1 }), false).level).toBe(1)
    expect(applyAnswer(question({ level: 4, correctStreak: 2 }), true).level).toBe(4)
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
