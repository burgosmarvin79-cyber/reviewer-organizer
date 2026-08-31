import { db } from './db'
import { supabase } from './lib/supabase'
import { migratePendingPdfs } from './pdf-storage'
import type { Note, Question, Subject, TestSession } from './types'

let syncing = false
let activeUserId: string | null = null
let hooksInstalled = false
let realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null
let realtimeUserId: string | null = null
let realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null
let syncQueued = false

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

export async function syncUserData(userId: string) {
  if (!supabase) return
  if (syncing) { syncQueued = true; return }
  syncing = true
  try {
    const [remoteSubjects, remotePdfs, remoteNotes, remoteQuestions, remoteSessions] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', userId),
      supabase.from('pdf_reviewers').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('questions').select('*').eq('user_id', userId),
      supabase.from('test_sessions').select('*').eq('user_id', userId),
    ])
    if (remoteSubjects.error || remotePdfs.error || remoteNotes.error || remoteQuestions.error || remoteSessions.error) throw remoteSubjects.error ?? remotePdfs.error ?? remoteNotes.error ?? remoteQuestions.error ?? remoteSessions.error

    const localSubjects = await db.subjects.toArray()
    const hasRemoteData = remoteSubjects.data.length + remotePdfs.data.length + remoteNotes.data.length + remoteQuestions.data.length + remoteSessions.data.length > 0
    if (!hasRemoteData && localSubjects.length) {
      await Promise.all([
        supabase.from('subjects').upsert(localSubjects.map((item) => subjectRow(item, userId))),
        supabase.from('notes').upsert((await db.notes.toArray()).map((item) => noteRow(item, userId))),
        supabase.from('questions').upsert((await db.questions.toArray()).map((item) => questionRow(item, userId))),
        supabase.from('test_sessions').upsert((await db.testSessions.toArray()).map((item) => sessionRow(item, userId))),
      ])
      await migratePendingPdfs(userId)
      return
    }
    const subjects = remoteSubjects.data.map((item) => ({ id: item.id, name: item.name, description: item.description, color: item.color, createdAt: item.created_at, updatedAt: item.updated_at }))
    const notes = remoteNotes.data.map((item) => ({ id: item.id, subjectId: item.subject_id, title: item.title, content: item.content, createdAt: item.created_at, updatedAt: item.updated_at }))
    const questions = remoteQuestions.data.map((item) => ({ id: item.id, subjectId: item.subject_id, prompt: item.prompt, acceptedAnswers: item.accepted_answers, explanation: item.explanation, level: item.level, totalAttempts: item.total_attempts, totalCorrect: item.total_correct, lastAnsweredAt: item.last_answered_at ?? undefined, createdAt: item.created_at, updatedAt: item.updated_at }))
    const sessions = remoteSessions.data.map((item) => ({ id: item.id, subjectId: item.subject_id, subjectName: item.subject_name, level: item.level, startedAt: item.started_at, completedAt: item.completed_at, questionCount: item.question_count, correctCount: item.correct_count, skippedCount: item.skipped_count, percentage: Number(item.percentage), answers: item.answers }))
    await db.transaction('rw', db.subjects, db.notes, db.questions, db.testSessions, async () => {
      const [subjectKeys, noteKeys, questionKeys, sessionKeys] = await Promise.all([
        db.subjects.toCollection().primaryKeys(), db.notes.toCollection().primaryKeys(), db.questions.toCollection().primaryKeys(), db.testSessions.toCollection().primaryKeys(),
      ])
      const subjectIds = new Set(subjects.map((item) => item.id)); const noteIds = new Set(notes.map((item) => item.id))
      const questionIds = new Set(questions.map((item) => item.id)); const sessionIds = new Set(sessions.map((item) => item.id))
      await Promise.all([
        db.subjects.bulkPut(subjects), db.notes.bulkPut(notes), db.questions.bulkPut(questions), db.testSessions.bulkPut(sessions),
        db.subjects.bulkDelete(subjectKeys.filter((key) => !subjectIds.has(key))), db.notes.bulkDelete(noteKeys.filter((key) => !noteIds.has(key))),
        db.questions.bulkDelete(questionKeys.filter((key) => !questionIds.has(key))), db.testSessions.bulkDelete(sessionKeys.filter((key) => !sessionIds.has(key))),
      ])
    })
    await migratePendingPdfs(userId)
    const { data: refreshedPdfRows, error: refreshedPdfError } = await supabase.from('pdf_reviewers').select('*').eq('user_id', userId)
    if (refreshedPdfError) throw refreshedPdfError
    const remotePdfItems = refreshedPdfRows.map((item) => ({
      id: item.id, subjectId: item.subject_id, name: item.name, storagePath: item.storage_path,
      mimeType: item.mime_type, size: Number(item.size), createdAt: item.created_at,
    }))
    const remotePdfIds = new Set(remotePdfItems.map((item) => item.id))
    await db.transaction('rw', db.pdfs, db.pdfFiles, async () => {
      const localPdfs = await db.pdfs.toArray()
      const removedCloudPdfIds = localPdfs.filter((pdf) => pdf.storagePath && !remotePdfIds.has(pdf.id)).map((pdf) => pdf.id)
      await db.pdfs.bulkPut(remotePdfItems)
      await db.pdfs.bulkDelete(removedCloudPdfIds)
      await db.pdfFiles.bulkDelete(removedCloudPdfIds)
    })
  } finally {
    syncing = false
    if (syncQueued) { syncQueued = false; void syncUserData(userId) }
  }
}

export function subscribeToUserChanges(userId: string) {
  if (!supabase || (realtimeChannel && realtimeUserId === userId)) return
  unsubscribeFromUserChanges()
  const refresh = () => {
    if (realtimeRefreshTimer) clearTimeout(realtimeRefreshTimer)
    realtimeRefreshTimer = setTimeout(() => { realtimeRefreshTimer = null; void syncUserData(userId) }, 250)
  }
  realtimeUserId = userId
  realtimeChannel = supabase.channel(`reviewer-organizer-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pdf_reviewers', filter: `user_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `user_id=eq.${userId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'test_sessions', filter: `user_id=eq.${userId}` }, refresh)
    .subscribe()
}

export function unsubscribeFromUserChanges() {
  if (realtimeRefreshTimer) { clearTimeout(realtimeRefreshTimer); realtimeRefreshTimer = null }
  if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel)
  realtimeChannel = null
  realtimeUserId = null
}
