import type { Session } from '@supabase/supabase-js'
import { db } from './db'
import { supabase } from './lib/supabase'
import type { Note, Question, Subject, TestSession } from './types'

let syncing = false
let activeUserId: string | null = null
let hooksInstalled = false
let realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null

function subjectRow(item: Subject, userId: string) { return { id: item.id, user_id: userId, name: item.name, description: item.description, color: item.color, created_at: item.createdAt, updated_at: item.updatedAt } }
function noteRow(item: Note, userId: string) { return { id: item.id, user_id: userId, subject_id: item.subjectId, title: item.title, content: item.content, created_at: item.createdAt, updated_at: item.updatedAt } }
function questionRow(item: Question, userId: string) { return { id: item.id, user_id: userId, subject_id: item.subjectId, prompt: item.prompt, accepted_answers: item.acceptedAnswers, explanation: item.explanation, level: item.level, total_attempts: item.totalAttempts, total_correct: item.totalCorrect, last_answered_at: item.lastAnsweredAt ?? null, created_at: item.createdAt, updated_at: item.updatedAt } }
function sessionRow(item: TestSession, userId: string) { return { id: item.id, user_id: userId, subject_id: item.subjectId, subject_name: item.subjectName, level: item.level, started_at: item.startedAt, completed_at: item.completedAt, question_count: item.questionCount, correct_count: item.correctCount, skipped_count: item.skippedCount ?? 0, percentage: item.percentage, answers: item.answers } }

export function enableUserSync(userId: string) {
  activeUserId = userId
  if (hooksInstalled) return
  hooksInstalled = true
  db.subjects.hook('creating', (_key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('subjects').upsert(subjectRow(item, activeUserId)) })
  db.subjects.hook('updating', (changes, key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('subjects').upsert(subjectRow({ ...item, ...changes, id: key } as Subject, activeUserId)) })
  db.subjects.hook('deleting', (key) => { if (activeUserId && !syncing && supabase) void supabase.from('subjects').delete().eq('id', key).eq('user_id', activeUserId) })
  db.notes.hook('creating', (_key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('notes').upsert(noteRow(item, activeUserId)) })
  db.notes.hook('updating', (changes, key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('notes').upsert(noteRow({ ...item, ...changes, id: key } as Note, activeUserId)) })
  db.notes.hook('deleting', (key) => { if (activeUserId && !syncing && supabase) void supabase.from('notes').delete().eq('id', key).eq('user_id', activeUserId) })
  db.questions.hook('creating', (_key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('questions').upsert(questionRow(item, activeUserId)) })
  db.questions.hook('updating', (changes, key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('questions').upsert(questionRow({ ...item, ...changes, id: key } as Question, activeUserId)) })
  db.questions.hook('deleting', (key) => { if (activeUserId && !syncing && supabase) void supabase.from('questions').delete().eq('id', key).eq('user_id', activeUserId) })
  db.testSessions.hook('creating', (_key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('test_sessions').upsert(sessionRow(item, activeUserId)) })
  db.testSessions.hook('updating', (changes, key, item) => { if (activeUserId && !syncing && supabase) void supabase.from('test_sessions').upsert(sessionRow({ ...item, ...changes, id: key } as TestSession, activeUserId)) })
  db.testSessions.hook('deleting', (key) => { if (activeUserId && !syncing && supabase) void supabase.from('test_sessions').delete().eq('id', key).eq('user_id', activeUserId) })
}

export async function syncUserData(session: Session) {
  if (!supabase || syncing) return
  syncing = true
  try {
    const userId = session.user.id
    const [remoteSubjects, remoteNotes, remoteQuestions, remoteSessions] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('questions').select('*').eq('user_id', userId),
      supabase.from('test_sessions').select('*').eq('user_id', userId),
    ])
    if (remoteSubjects.error || remoteNotes.error || remoteQuestions.error || remoteSessions.error) throw remoteSubjects.error ?? remoteNotes.error ?? remoteQuestions.error ?? remoteSessions.error

    const localSubjects = await db.subjects.toArray()
    const hasRemoteData = remoteSubjects.data.length + remoteNotes.data.length + remoteQuestions.data.length + remoteSessions.data.length > 0
    if (!hasRemoteData && localSubjects.length) {
      await Promise.all([
        supabase.from('subjects').upsert(localSubjects.map((item) => subjectRow(item, userId))),
        supabase.from('notes').upsert((await db.notes.toArray()).map((item) => noteRow(item, userId))),
        supabase.from('questions').upsert((await db.questions.toArray()).map((item) => questionRow(item, userId))),
        supabase.from('test_sessions').upsert((await db.testSessions.toArray()).map((item) => sessionRow(item, userId))),
      ])
      return
    }
    await db.transaction('rw', db.subjects, db.notes, db.questions, db.testSessions, async () => {
      await Promise.all([db.subjects.clear(), db.notes.clear(), db.questions.clear(), db.testSessions.clear()])
      await db.subjects.bulkPut(remoteSubjects.data.map((item) => ({ id: item.id, name: item.name, description: item.description, color: item.color, createdAt: item.created_at, updatedAt: item.updated_at })))
      await db.notes.bulkPut(remoteNotes.data.map((item) => ({ id: item.id, subjectId: item.subject_id, title: item.title, content: item.content, createdAt: item.created_at, updatedAt: item.updated_at })))
      await db.questions.bulkPut(remoteQuestions.data.map((item) => ({ id: item.id, subjectId: item.subject_id, prompt: item.prompt, acceptedAnswers: item.accepted_answers, explanation: item.explanation, level: item.level, totalAttempts: item.total_attempts, totalCorrect: item.total_correct, lastAnsweredAt: item.last_answered_at ?? undefined, createdAt: item.created_at, updatedAt: item.updated_at })))
      await db.testSessions.bulkPut(remoteSessions.data.map((item) => ({ id: item.id, subjectId: item.subject_id, subjectName: item.subject_name, level: item.level, startedAt: item.started_at, completedAt: item.completed_at, questionCount: item.question_count, correctCount: item.correct_count, skippedCount: item.skipped_count, percentage: Number(item.percentage), answers: item.answers })))
    })
  } finally { syncing = false }
}

export function subscribeToUserChanges(userId: string) {
  if (!supabase || realtimeChannel) return
  realtimeChannel = supabase.channel(`reviewer-organizer-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` }, () => { void syncUserData({ user: { id: userId } } as Session) })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` }, () => { void syncUserData({ user: { id: userId } } as Session) })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `user_id=eq.${userId}` }, () => { void syncUserData({ user: { id: userId } } as Session) })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'test_sessions', filter: `user_id=eq.${userId}` }, () => { void syncUserData({ user: { id: userId } } as Session) })
    .subscribe()
}
