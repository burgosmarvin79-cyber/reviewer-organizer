import { beforeEach, describe, expect, it } from 'vitest'
import { createBackup, restoreBackup } from './backup'
import { db } from './db'
import type { BackupFile } from './types'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('backup compatibility', () => {
  it('converts a version 1 multiple-choice question during restore', async () => {
    const legacyBackup = {
      format: 'reviewer-organizer-backup',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      subjects: [],
      pdfs: [],
      notes: [],
      questions: [{
        id: 'legacy-question', subjectId: 'subject-1', prompt: 'Capital of the Philippines?',
        choices: [{ id: 'manila', text: 'Manila' }, { id: 'cebu', text: 'Cebu' }],
        correctChoiceId: 'manila', explanation: 'Manila is the capital.', level: 2,
        correctStreak: 1, totalAttempts: 3, totalCorrect: 2,
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      testSessions: [],
      settings: [],
    } as unknown as BackupFile

    await restoreBackup(legacyBackup)

    const restored = await db.questions.get('legacy-question')
    expect(restored?.acceptedAnswers).toEqual(['Manila'])
    expect(restored?.level).toBe(2)
  })

  it('exports new backups as version 3', async () => {
    expect((await createBackup()).version).toBe(3)
  })

  it('restores PDF metadata separately from its binary file', async () => {
    const backup = {
      format: 'reviewer-organizer-backup', version: 2, exportedAt: '2026-01-01T00:00:00.000Z',
      subjects: [{ id: 'subject-1', name: 'Biology', description: '', color: '#a51d25', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      pdfs: [{ id: 'pdf-1', subjectId: 'subject-1', name: 'Cells.pdf', mimeType: 'application/pdf', size: 5, createdAt: '2026-01-01T00:00:00.000Z', fileDataBase64: 'data:application/pdf;base64,JVBERi0=' }],
      notes: [], questions: [], testSessions: [], settings: [],
    } as BackupFile

    await restoreBackup(backup)

    expect(await db.pdfs.get('pdf-1')).toEqual(expect.objectContaining({ name: 'Cells.pdf', storagePath: undefined }))
    expect((await db.pdfFiles.get('pdf-1'))?.fileData).toBeDefined()
    expect(await db.pdfs.get('pdf-1')).not.toHaveProperty('fileData')
  })
})
