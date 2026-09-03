/**
 * Defines the browser's offline IndexedDB database through Dexie.
 * Version upgrades preserve data created by older releases of the app.
 */
import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, Choice, LocalPdfFile, Note, PdfReviewer, Question, Subject, TestSession } from './types'

type LegacyQuestion = Omit<Question, 'acceptedAnswers'> & {
  choices?: Choice[]
  correctChoiceId?: string
  correctStreak?: number
  acceptedAnswers?: string[]
}

class ReviewerDatabase extends Dexie {
  // EntityTable supplies TypeScript with each table's record and primary-key type.
  subjects!: EntityTable<Subject, 'id'>
  pdfs!: EntityTable<PdfReviewer, 'id'>
  pdfFiles!: EntityTable<LocalPdfFile, 'id'>
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
    this.version(2).stores({
      subjects: 'id, name, updatedAt',
      pdfs: 'id, subjectId, createdAt',
      notes: 'id, subjectId, title, updatedAt',
      questions: 'id, subjectId, level, [subjectId+level], updatedAt',
      testSessions: 'id, subjectId, level, completedAt',
      settings: 'id',
    }).upgrade(async (transaction) => {
      // Version 2 replaced multiple-choice fields with accepted text answers.
      await transaction.table<LegacyQuestion>('questions').toCollection().modify((question) => {
        if (!question.acceptedAnswers?.length) {
          const previousCorrectAnswer = question.choices?.find((choice) => choice.id === question.correctChoiceId)?.text
          question.acceptedAnswers = previousCorrectAnswer ? [previousCorrectAnswer] : ['Review this answer']
        }
        delete question.choices
        delete question.correctChoiceId
        delete question.correctStreak
      })
    })
    this.version(3).stores({
      subjects: 'id, name, updatedAt',
      pdfs: 'id, subjectId, createdAt',
      pdfFiles: 'id',
      notes: 'id, subjectId, title, updatedAt',
      questions: 'id, subjectId, level, [subjectId+level], updatedAt',
      testSessions: 'id, subjectId, level, completedAt',
      settings: 'id',
    }).upgrade(async (transaction) => {
      // Keep large PDF Blobs separate so ordinary PDF metadata stays lightweight.
      const pdfs = transaction.table<PdfReviewer & { fileData?: Blob }>('pdfs')
      const pdfFiles = transaction.table<LocalPdfFile>('pdfFiles')
      const legacyPdfs = await pdfs.toArray()
      for (const pdf of legacyPdfs) {
        if (pdf.fileData) {
          await pdfFiles.put({ id: pdf.id, fileData: pdf.fileData })
          const metadata = { ...pdf }
          delete metadata.fileData
          await pdfs.put(metadata)
        }
      }
    })
  }
}

export const db = new ReviewerDatabase()

export async function deleteSubjectCascade(subjectId: string) {
  // IndexedDB has no SQL foreign-key cascade, so related records are removed here.
  await db.transaction('rw', [db.subjects, db.pdfs, db.pdfFiles, db.notes, db.questions, db.testSessions], async () => {
    const pdfIds = await db.pdfs.where('subjectId').equals(subjectId).primaryKeys()
    await Promise.all([
      db.pdfFiles.bulkDelete(pdfIds),
      db.pdfs.where('subjectId').equals(subjectId).delete(),
      db.notes.where('subjectId').equals(subjectId).delete(),
      db.questions.where('subjectId').equals(subjectId).delete(),
      db.testSessions.where('subjectId').equals(subjectId).delete(),
    ])
    await db.subjects.delete(subjectId)
  })
}
