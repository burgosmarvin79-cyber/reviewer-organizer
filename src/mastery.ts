import type { MasteryLevel, Question } from './types'

export const LEVEL_NAMES: Record<MasteryLevel, string> = {
  1: 'Test 1 · New',
  2: 'Test 2 · Learning',
  3: 'Test 3 · Mastered',
  4: 'Final Test Reviewer',
}

export function applyAnswer(question: Question, wasCorrect: boolean): Question {
  const now = new Date().toISOString()
  let level = question.level
  let correctStreak = wasCorrect ? question.correctStreak + 1 : 0

  if (wasCorrect && correctStreak >= 3 && level < 4) {
    level = (level + 1) as MasteryLevel
    correctStreak = 0
  } else if (!wasCorrect && level > 1) {
    level = (level - 1) as MasteryLevel
  }

  return {
    ...question,
    level,
    correctStreak,
    totalAttempts: question.totalAttempts + 1,
    totalCorrect: question.totalCorrect + (wasCorrect ? 1 : 0),
    lastAnsweredAt: now,
    updatedAt: now,
  }
}

export function randomSelection<T>(items: T[], count: number): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  return shuffled.slice(0, Math.min(Math.max(count, 1), shuffled.length))
}
