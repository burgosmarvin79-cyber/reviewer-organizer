import type { MasteryLevel, Question } from './types'

export const LEVEL_NAMES: Record<MasteryLevel, string> = {
  1: 'Test 1 · New',
  2: 'Test 2 · Learning',
  3: 'Test 3 · Mastered',
  4: 'Final Test Reviewer',
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function isAcceptedAnswer(answer: string, acceptedAnswers: string[]): boolean {
  const normalized = normalizeAnswer(answer)
  return normalized.length > 0 && acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized)
}

export function recordAnswer(question: Question, wasCorrect: boolean): Question {
  const now = new Date().toISOString()
  return {
    ...question,
    totalAttempts: question.totalAttempts + 1,
    totalCorrect: question.totalCorrect + (wasCorrect ? 1 : 0),
    lastAnsweredAt: now,
    updatedAt: now,
  }
}

export function moveQuestion(question: Question, level: MasteryLevel): Question {
  return { ...question, level, updatedAt: new Date().toISOString() }
}

export function randomSelection<T>(items: T[], count: number): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  return shuffled.slice(0, Math.min(Math.max(count, 1), shuffled.length))
}
