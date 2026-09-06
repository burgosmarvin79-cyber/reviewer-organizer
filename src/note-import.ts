/** Validates ChatGPT-generated note JSON before it reaches the database. */
export const NOTE_IMPORT_FORMAT = 'reviewer-organizer-notes'
export const MAX_IMPORT_NOTES = 200

import type { NoteLevel } from './types'

export interface ImportableNote {
  title: string
  content: string
  level: NoteLevel
}

export interface NoteImportResult {
  notes: ImportableNote[]
  warnings: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  // JSON values may be primitives or arrays; an import item must be an object.
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function repairChatGptJson(text: string) {
  // ChatGPT sometimes wraps JSON in a code fence or forgets to escape quotes in
  // note content containing HTML examples. Limit repair to content immediately
  // followed by the required level field so structural JSON stays strict.
  const source = text.trim()
  const fencedMatch = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const objectStart = source.indexOf('{')
  const objectEnd = source.lastIndexOf('}')
  const unwrapped = fencedMatch?.[1].trim()
    ?? (objectStart >= 0 && objectEnd > objectStart ? source.slice(objectStart, objectEnd + 1) : source)
  return unwrapped.replace(
    /("content"\s*:\s*")([\s\S]*?)("\s*,\s*"level"\s*:\s*[123])/g,
    (_match, start: string, content: string, end: string) => {
      const escapedContent = content.replace(/(^|[^\\])"/g, '$1\\"')
      return `${start}${escapedContent}${end}`
    },
  )
}

export function normalizeNoteTitle(title: string) {
  // Normalized titles make duplicate detection case- and spacing-insensitive.
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function parseNoteImport(text: string): NoteImportResult {
  if (!text.trim()) throw new Error('The selected file is empty.')
  let value: unknown
  try { value = JSON.parse(text) }
  catch {
    try { value = JSON.parse(repairChatGptJson(text)) }
    catch { throw new Error('This notes file contains invalid JSON. Download it again from ChatGPT or fix the file content.') }
  }
  if (!isRecord(value)) throw new Error('The file must contain one notes object.')
  if (value.format !== NOTE_IMPORT_FORMAT) throw new Error(`The format must be “${NOTE_IMPORT_FORMAT}”.`)
  if (value.version !== 1) throw new Error('Only notes version 1 is currently supported.')
  if (!Array.isArray(value.notes)) throw new Error('The file must contain a notes list.')
  if (!value.notes.length) throw new Error('The notes list is empty.')
  if (value.notes.length > MAX_IMPORT_NOTES) throw new Error(`Import up to ${MAX_IMPORT_NOTES} notes at a time.`)

  const notes: ImportableNote[] = []
  const warnings: string[] = []
  const seenTitles = new Set<string>()
  // Validate every field and collect safe, normalized notes for the preview screen.
  value.notes.forEach((item, index) => {
    const number = index + 1
    if (!isRecord(item)) throw new Error(`Note ${number} must be an object.`)
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    const content = typeof item.content === 'string' ? item.content.trim() : ''
    const level = item.level === undefined ? 1 : Number(item.level)
    if (!title) throw new Error(`Note ${number} is missing its title.`)
    if (!content) throw new Error(`Note ${number} is missing its content.`)
    if (![1, 2, 3].includes(level)) throw new Error(`Note ${number} has an invalid level. Use 1, 2, or 3.`)
    const key = normalizeNoteTitle(title)
    if (seenTitles.has(key)) { warnings.push(`Skipped duplicate inside the file: “${title}”`); return }
    seenTitles.add(key)
    notes.push({ title, content, level: level as NoteLevel })
  })
  if (!notes.length) throw new Error('The file contains no unique notes to import.')
  return { notes, warnings }
}
