import { supabase } from './lib/supabase'
import type { Note, Question, Subject } from './types'

async function userId() {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Please sign in again before saving data.')
  return data.user.id
}

export async function saveSubject(subject: Subject) {
  const id = await userId()
  const { error } = await supabase!.from('subjects').upsert({ id: subject.id, user_id: id, name: subject.name, description: subject.description, color: subject.color, created_at: subject.createdAt, updated_at: subject.updatedAt })
  if (error) throw error
}

export async function deleteSubject(subjectId: string) {
  const id = await userId()
  const { error } = await supabase!.from('subjects').delete().eq('id', subjectId).eq('user_id', id)
  if (error) throw error
}

export async function saveNote(note: Note) {
  const id = await userId()
  const { error } = await supabase!.from('notes').upsert({
    id: note.id, user_id: id, subject_id: note.subjectId, title: note.title,
    content: note.content, created_at: note.createdAt, updated_at: note.updatedAt,
  })
  if (error) throw error
}

export async function deleteNote(noteId: string) {
  const id = await userId()
  const { error } = await supabase!.from('notes').delete().eq('id', noteId).eq('user_id', id)
  if (error) throw error
}

function questionRow(question: Question, ownerId: string) {
  return {
    id: question.id, user_id: ownerId, subject_id: question.subjectId, prompt: question.prompt,
    accepted_answers: question.acceptedAnswers, explanation: question.explanation, level: question.level,
    total_attempts: question.totalAttempts, total_correct: question.totalCorrect,
    last_answered_at: question.lastAnsweredAt ?? null, created_at: question.createdAt, updated_at: question.updatedAt,
  }
}

export async function saveQuestion(question: Question) {
  const ownerId = await userId()
  const { error } = await supabase!.from('questions').upsert(questionRow(question, ownerId))
  if (error) throw error
}

export async function saveQuestions(questions: Question[]) {
  if (!questions.length) return
  const ownerId = await userId()
  const { error } = await supabase!.from('questions').upsert(questions.map((question) => questionRow(question, ownerId)))
  if (error) throw error
}
