import { db } from './db'
import type { BackupFile, Choice, PdfReviewer, Question } from './types'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded] = dataUrl.split(',')
  if (!metadata || !encoded || !metadata.startsWith('data:')) throw new Error('Invalid PDF data in backup.')
  const mimeType = metadata.match(/^data:([^;]+)/)?.[1] ?? 'application/pdf'
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}

export async function createBackup(): Promise<BackupFile> {
  const [subjects, pdfs, notes, questions, testSessions, settings] = await Promise.all([
    db.subjects.toArray(),
    db.pdfs.toArray(),
    db.notes.toArray(),
    db.questions.toArray(),
    db.testSessions.toArray(),
    db.settings.toArray(),
  ])
  return {
    format: 'reviewer-organizer-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    subjects,
    pdfs: await Promise.all(pdfs.map(async ({ fileData, ...pdf }) => ({ ...pdf, fileDataBase64: await blobToDataUrl(fileData) }))),
    notes,
    questions,
    testSessions,
    settings,
  }
}

export function validateBackup(value: unknown): asserts value is BackupFile {
  if (!value || typeof value !== 'object') throw new Error('This file is not a valid backup.')
  const backup = value as Partial<BackupFile>
  if (backup.format !== 'reviewer-organizer-backup' || (backup.version !== 1 && backup.version !== 2)) throw new Error('Unsupported backup format or version.')
  for (const key of ['subjects', 'pdfs', 'notes', 'questions', 'testSessions', 'settings'] as const) {
    if (!Array.isArray(backup[key])) throw new Error(`Backup is missing ${key}.`)
  }
}

export async function restoreBackup(backup: BackupFile) {
  const pdfs: PdfReviewer[] = backup.pdfs.map(({ fileDataBase64, ...pdf }) => ({ ...pdf, fileData: dataUrlToBlob(fileDataBase64) }))
  const questions: Question[] = backup.questions.map((storedQuestion) => {
    const question = { ...storedQuestion } as Question & { acceptedAnswers?: string[]; choices?: Choice[]; correctChoiceId?: string; correctStreak?: number }
    if (!question.acceptedAnswers?.length) {
      const previousAnswer = question.choices?.find((choice) => choice.id === question.correctChoiceId)?.text
      question.acceptedAnswers = previousAnswer ? [previousAnswer] : ['Review this answer']
    }
    delete question.choices
    delete question.correctChoiceId
    delete question.correctStreak
    return question
  })
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
    await db.subjects.bulkAdd(backup.subjects)
    await db.pdfs.bulkAdd(pdfs)
    await db.notes.bulkAdd(backup.notes)
    await db.questions.bulkAdd(questions)
    await db.testSessions.bulkAdd(backup.testSessions)
    await db.settings.bulkAdd(backup.settings)
  })
}
