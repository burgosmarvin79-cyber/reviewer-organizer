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
  fileData: Blob
  mimeType: string
  size: number
  createdAt: string
}

export interface Note {
  id: string
  subjectId: string
  title: string
  content: string
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
  choices: Choice[]
  correctChoiceId: string
  explanation: string
  level: MasteryLevel
  correctStreak: number
  totalAttempts: number
  totalCorrect: number
  lastAnsweredAt?: string
  createdAt: string
  updatedAt: string
}

export interface TestAnswer {
  questionId: string
  prompt: string
  choices: Choice[]
  selectedChoiceId: string
  correctChoiceId: string
  explanation: string
  wasCorrect: boolean
  levelBefore: MasteryLevel
  levelAfter: MasteryLevel
  answeredAt: string
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
  version: 1
  exportedAt: string
  subjects: Subject[]
  pdfs: Array<Omit<PdfReviewer, 'fileData'> & { fileDataBase64: string }>
  notes: Note[]
  questions: Question[]
  testSessions: TestSession[]
  settings: AppSettings[]
}
