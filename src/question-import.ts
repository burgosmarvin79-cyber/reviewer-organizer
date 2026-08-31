import type { MasteryLevel } from './types'

export const QUESTION_IMPORT_FORMAT = 'reviewer-organizer-questions'
export const MAX_IMPORT_QUESTIONS = 500

export interface ImportableQuestion {
  prompt: string
  acceptedAnswers: string[]
  explanation: string
  level: MasteryLevel
}

export interface QuestionImportResult {
  questions: ImportableQuestion[]
  warnings: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeQuestionPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function parseQuestionImport(text: string): QuestionImportResult {
  const source = text.trim()
  if (!source) throw new Error('The selected file is empty.')

  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    throw new Error('This is not valid JSON. Ask ChatGPT to return JSON only, without headings or ``` marks.')
  }

  if (!isRecord(value)) throw new Error('The file must contain one questionnaire object.')
  if (value.format !== QUESTION_IMPORT_FORMAT) throw new Error(`The format must be “${QUESTION_IMPORT_FORMAT}”.`)
  if (value.version !== 1) throw new Error('Only questionnaire version 1 is currently supported.')
  if (!Array.isArray(value.questions)) throw new Error('The file must contain a questions list.')
  if (!value.questions.length) throw new Error('The questions list is empty.')
  if (value.questions.length > MAX_IMPORT_QUESTIONS) throw new Error(`Import up to ${MAX_IMPORT_QUESTIONS} questions at a time.`)

  const questions: ImportableQuestion[] = []
  const warnings: string[] = []
  const seenPrompts = new Set<string>()

  value.questions.forEach((item, index) => {
    const number = index + 1
    if (!isRecord(item)) throw new Error(`Question ${number} must be an object.`)

    const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : ''
    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : ''
    if (!prompt) throw new Error(`Question ${number} is missing its prompt.`)
    if (!explanation) throw new Error(`Question ${number} is missing its explanation.`)
    if (!Array.isArray(item.acceptedAnswers)) throw new Error(`Question ${number} must have an acceptedAnswers list.`)

    const acceptedAnswers = [...new Set(item.acceptedAnswers
      .filter((answer): answer is string => typeof answer === 'string')
      .map((answer) => answer.trim())
      .filter(Boolean))]
    if (!acceptedAnswers.length) throw new Error(`Question ${number} needs at least one accepted answer.`)
    if (acceptedAnswers.length > 8) throw new Error(`Question ${number} has more than 8 accepted answers.`)

    const level = item.level === undefined ? 1 : item.level
    if (![1, 2, 3, 4].includes(Number(level))) throw new Error(`Question ${number} has an invalid level. Use 1, 2, 3, or 4.`)

    const normalizedPrompt = normalizeQuestionPrompt(prompt)
    if (seenPrompts.has(normalizedPrompt)) {
      warnings.push(`Skipped duplicate inside the file: “${prompt}”`)
      return
    }
    seenPrompts.add(normalizedPrompt)
    questions.push({ prompt, acceptedAnswers, explanation, level: Number(level) as MasteryLevel })
  })

  if (!questions.length) throw new Error('The file contains no unique questions to import.')
  return { questions, warnings }
}
