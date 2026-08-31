export type MasteryLevel = 1 | 2 | 3 | 4

export interface Subject {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface PdfReviewer {
  id: string
  subjectId: string
  name: string
  mimeType: string
  size: number
  createdAt: string
  storagePath?: string
}

export type NoteLevel = 1 | 2 | 3

export interface LocalPdfFile {
  id: string
  fileData: Blob
}

export interface Note {
  id: string
  subjectId: string
  title: string
  content: string
  level: NoteLevel
  createdAt: string
  updatedAt: string
}

export interface Choice {
  id: string
  text: string
}

export interface Question {
  id: string
  subjectId: string
  prompt: string
  acceptedAnswers: string[]
  explanation: string
  level: MasteryLevel
  totalAttempts: number
  totalCorrect: number
  lastAnsweredAt?: string
  createdAt: string
  updatedAt: string
}

export interface TestAnswer {
  questionId: string
  prompt: string
  selectedAnswer: string
  correctAnswer: string
  acceptedAnswers: string[]
  explanation: string
  wasCorrect: boolean
  wasSkipped?: boolean
  levelBefore: MasteryLevel
  levelAfter: MasteryLevel
  answeredAt: string
  choices?: Choice[]
  selectedChoiceId?: string
  correctChoiceId?: string
}

export interface TestSession {
  id: string
  subjectId: string
  subjectName: string
  level: MasteryLevel
  startedAt: string
  completedAt: string
  questionCount: number
  correctCount: number
  skippedCount?: number
  percentage: number
  answers: TestAnswer[]
}

export interface AppSettings {
  id: 'preferences'
  defaultTestSize: number
  backupReminderAt?: string
}

export interface BackupFile {
  format: 'reviewer-organizer-backup'
  version: 1 | 2 | 3
  exportedAt: string
  subjects: Subject[]
  pdfs: Array<PdfReviewer & { fileDataBase64: string }>
  notes: Note[]
  questions: Question[]
  testSessions: TestSession[]
  settings: AppSettings[]
}
