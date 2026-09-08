/** Pure study helpers used to evaluate answers and manage question progression. */
import type { MasteryLevel, Question, ReviewRating, ReviewState } from './types'

export const LEVEL_NAMES: Record<MasteryLevel, string> = {
  1: 'Test 1 · New',
  2: 'Test 2 · Learning',
  3: 'Test 3 · Mastered',
  4: 'Final Test Reviewer',
}

export function normalizeAnswer(answer: string): string {
  // Ignore capitalization and repeated spaces without changing answer meaning.
  return answer.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function isAcceptedAnswer(answer: string, acceptedAnswers: string[]): boolean {
  const normalized = normalizeAnswer(answer)
  return normalized.length > 0 && acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized)
}

export function recordAnswer(question: Question, wasCorrect: boolean): Question {
  // Return a new object so React/Dexie can reliably detect the change.
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
  // Fisher-Yates produces an unbiased shuffle and does not mutate the input array.
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }
  return shuffled.slice(0, Math.min(Math.max(count, 1), shuffled.length))
}

export function createFlashcardSession(questions: Question[], levels: MasteryLevel[], count: number, shuffle: boolean): Question[] {
  const eligible = questions.filter((question) => levels.includes(question.level))
  const sessionSize = Math.min(Math.max(count, 1), eligible.length)
  return shuffle ? randomSelection(eligible, sessionSize) : eligible.slice(0, sessionSize)
}

const MINUTES = { minute: 1, hour: 60, day: 1440 }

export function isQuestionDue(question: Question, now = new Date()) {
  return !question.reviewDueAt || new Date(question.reviewDueAt).getTime() <= now.getTime()
}

export function isFlashcardRepeatAt(session: Question[], index: number) {
  const card = session[index]
  return Boolean(card && session.slice(0, index).some((earlierCard) => earlierCard.id === card.id))
}

export function prioritizeDueFlashcardRepeat(session: Question[], currentIndex: number, now = new Date()) {
  const nextIndex = currentIndex + 1
  const nextCardIsDueRepeat = isFlashcardRepeatAt(session, nextIndex) && isQuestionDue(session[nextIndex], now)
  if (nextCardIsDueRepeat) return session

  const dueRepeatIndex = session.findIndex((card, index) =>
    index > nextIndex && isFlashcardRepeatAt(session, index) && isQuestionDue(card, now),
  )
  if (dueRepeatIndex < 0) return session

  const reordered = [...session]
  const [dueRepeat] = reordered.splice(dueRepeatIndex, 1)
  reordered.splice(nextIndex, 0, dueRepeat)
  return reordered
}

export function flashcardIntervals(question: Question) {
  const current = Math.max(0, question.reviewIntervalMinutes ?? 0)
  const ease = Math.min(3.5, Math.max(1.3, question.reviewEase ?? 2.3))
  return {
    again: MINUTES.minute,
    hard: current ? Math.max(5, Math.round(current * 1.2)) : 5,
    good: current ? Math.max(45, Math.round(current * ease)) : 45,
    easy: current ? Math.max(MINUTES.day, Math.round(current * ease * 1.3)) : MINUTES.day,
  } satisfies Record<ReviewRating, number>
}

export function formatReviewInterval(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  if (minutes < MINUTES.day) return `${Math.round(minutes / 60)} hr`
  const days = Math.round(minutes / MINUTES.day)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`
  const months = Math.round(days / 30)
  return `${months} mo`
}

export function scheduleFlashcard(question: Question, rating: ReviewRating, now = new Date()): Question {
  const intervals = flashcardIntervals(question)
  const interval = intervals[rating]
  const previousEase = question.reviewEase ?? 2.3
  const ease = Math.min(3.5, Math.max(1.3, previousEase + (rating === 'again' ? -0.2 : rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0)))
  const repetitions = rating === 'again' ? 0 : (question.reviewRepetitions ?? 0) + 1
  const state: ReviewState = rating === 'again' ? 'learning' : interval >= 30 * MINUTES.day ? 'mastered' : interval >= MINUTES.day ? 'review' : 'learning'
  const due = new Date(now.getTime() + interval * 60_000).toISOString()
  return {
    ...question,
    level: rating === 'easy' ? Math.min(4, question.level + 1) as MasteryLevel : question.level,
    reviewState: state,
    reviewIntervalMinutes: interval,
    reviewEase: ease,
    reviewDueAt: due,
    reviewRepetitions: repetitions,
    reviewLapses: (question.reviewLapses ?? 0) + (rating === 'again' ? 1 : 0),
    lastAnsweredAt: now.toISOString(),
    totalAttempts: question.totalAttempts + 1,
    totalCorrect: question.totalCorrect + (rating === 'again' ? 0 : 1),
    updatedAt: now.toISOString(),
  }
}
