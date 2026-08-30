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

  it('exports new backups as version 2', async () => {
    expect((await createBackup()).version).toBe(2)
  })
})
