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
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeNoteTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function parseNoteImport(text: string): NoteImportResult {
  if (!text.trim()) throw new Error('The selected file is empty.')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('This is not valid JSON. Ask ChatGPT to return JSON only, without headings or ``` marks.') }
  if (!isRecord(value)) throw new Error('The file must contain one notes object.')
  if (value.format !== NOTE_IMPORT_FORMAT) throw new Error(`The format must be “${NOTE_IMPORT_FORMAT}”.`)
  if (value.version !== 1) throw new Error('Only notes version 1 is currently supported.')
  if (!Array.isArray(value.notes)) throw new Error('The file must contain a notes list.')
  if (!value.notes.length) throw new Error('The notes list is empty.')
  if (value.notes.length > MAX_IMPORT_NOTES) throw new Error(`Import up to ${MAX_IMPORT_NOTES} notes at a time.`)

  const notes: ImportableNote[] = []
  const warnings: string[] = []
  const seenTitles = new Set<string>()
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
