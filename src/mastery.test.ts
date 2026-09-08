/** Unit tests for answer matching, statistics, mastery movement, and selection. */
import { describe, expect, it, vi } from 'vitest'
import { createFlashcardSession, flashcardIntervals, formatReviewInterval, isAcceptedAnswer, isFlashcardRetryAt, isQuestionDue, moveQuestion, normalizeAnswer, prioritizeDueFlashcardRetry, randomSelection, recordAnswer, scheduleFlashcard } from './mastery'
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

  it('builds a flashcard session only from the selected mastery tiers', () => {
    const questions = [
      question({ id: 'q1', level: 1 }),
      question({ id: 'q2', level: 2 }),
      question({ id: 'q3', level: 2 }),
      question({ id: 'q4', level: 4 }),
    ]

    const session = createFlashcardSession(questions, [2, 4], 2, false)

    expect(session.map((item) => item.id)).toEqual(['q2', 'q3'])
    expect(questions.map((item) => item.id)).toEqual(['q1', 'q2', 'q3', 'q4'])
  })
})

describe('adaptive flashcard scheduling', () => {
  const now = new Date('2026-09-08T08:00:00.000Z')

  it('starts with the requested short new-card review cycle', () => {
    expect(flashcardIntervals(question())).toEqual({ again: 1, hard: 5, good: 45, easy: 1440 })
  })

  it('grows successful intervals instead of keeping fixed button times', () => {
    const reviewed = question({ reviewIntervalMinutes: 1440, reviewEase: 2.3 })
    expect(flashcardIntervals(reviewed)).toEqual({ again: 1, hard: 1728, good: 3312, easy: 4306 })
    expect(formatReviewInterval(4306)).toBe('3 days')
  })

  it('schedules easy cards later and raises the mastery tier by one', () => {
    const updated = scheduleFlashcard(question({ level: 2 }), 'easy', now)
    expect(updated.level).toBe(3)
    expect(updated.reviewState).toBe('review')
    expect(updated.reviewDueAt).toBe('2026-09-09T08:00:00.000Z')
    expect(updated.totalAttempts).toBe(1)
    expect(updated.totalCorrect).toBe(1)
  })

  it('keeps an easy card at the highest mastery tier', () => {
    expect(scheduleFlashcard(question({ level: 4 }), 'easy', now).level).toBe(4)
  })

  it('does not change mastery tier for again, hard, or good', () => {
    for (const rating of ['again', 'hard', 'good'] as const) {
      expect(scheduleFlashcard(question({ level: 2 }), rating, now).level).toBe(2)
    }
  })

  it('resets a forgotten card to learning and makes it due in one minute', () => {
    const updated = scheduleFlashcard(question({ reviewIntervalMinutes: 10080, reviewRepetitions: 4 }), 'again', now)
    expect(updated.reviewState).toBe('learning')
    expect(updated.reviewRepetitions).toBe(0)
    expect(updated.reviewLapses).toBe(1)
    expect(isQuestionDue(updated, new Date('2026-09-08T08:01:00.000Z'))).toBe(true)
  })

  it('moves a due Again retry ahead of unanswered cards without interrupting the current card', () => {
    const current = question({ id: 'q1' })
    const retry = scheduleFlashcard(current, 'again', now)
    const session = [current, question({ id: 'q2' }), question({ id: 'q3' }), retry]

    const reordered = prioritizeDueFlashcardRetry(session, 0, new Date('2026-09-08T08:01:00.000Z'))

    expect(reordered.map((card) => card.id)).toEqual(['q1', 'q1', 'q2', 'q3'])
    expect(isFlashcardRetryAt(reordered, 1)).toBe(true)
    expect(session.map((card) => card.id)).toEqual(['q1', 'q2', 'q3', 'q1'])
  })

  it('keeps an Again retry waiting until its one-minute due time', () => {
    const current = question({ id: 'q1' })
    const retry = scheduleFlashcard(current, 'again', now)
    const session = [current, question({ id: 'q2' }), retry]

    expect(prioritizeDueFlashcardRetry(session, 0, new Date('2026-09-08T08:00:59.000Z'))).toBe(session)
  })

  it('keeps the next due retry stable when another retry is also due', () => {
    const first = question({ id: 'q1' })
    const second = question({ id: 'q2' })
    const session = [first, second, scheduleFlashcard(first, 'again', now), scheduleFlashcard(second, 'again', now)]
    const dueTime = new Date('2026-09-08T08:01:00.000Z')

    const once = prioritizeDueFlashcardRetry(session, 1, dueTime)
    const twice = prioritizeDueFlashcardRetry(once, 1, dueTime)

    expect(once).toBe(session)
    expect(twice).toBe(once)
  })
})
