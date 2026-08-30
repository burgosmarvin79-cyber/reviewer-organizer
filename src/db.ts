import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, Note, PdfReviewer, Question, Subject, TestSession } from './types'

class ReviewerDatabase extends Dexie {
  subjects!: EntityTable<Subject, 'id'>
  pdfs!: EntityTable<PdfReviewer, 'id'>
  notes!: EntityTable<Note, 'id'>
  questions!: EntityTable<Question, 'id'>
  testSessions!: EntityTable<TestSession, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('ReviewerOrganizerDatabase')
    this.version(1).stores({
      subjects: 'id, name, updatedAt',
      pdfs: 'id, subjectId, createdAt',
      notes: 'id, subjectId, title, updatedAt',
      questions: 'id, subjectId, level, [subjectId+level], updatedAt',
      testSessions: 'id, subjectId, level, completedAt',
      settings: 'id',
    })
  }
}

export const db = new ReviewerDatabase()

export async function deleteSubjectCascade(subjectId: string) {
  await db.transaction('rw', db.subjects, db.pdfs, db.notes, db.questions, db.testSessions, async () => {
    await Promise.all([
      db.pdfs.where('subjectId').equals(subjectId).delete(),
      db.notes.where('subjectId').equals(subjectId).delete(),
      db.questions.where('subjectId').equals(subjectId).delete(),
      db.testSessions.where('subjectId').equals(subjectId).delete(),
    ])
    await db.subjects.delete(subjectId)
  })
}
