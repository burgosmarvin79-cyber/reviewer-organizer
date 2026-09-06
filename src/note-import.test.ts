import { describe, expect, it } from 'vitest'
import { parseNoteImport } from './note-import'

describe('parseNoteImport', () => {
  it('accepts valid note JSON', () => {
    const result = parseNoteImport(JSON.stringify({
      format: 'reviewer-organizer-notes',
      version: 1,
      notes: [{ title: 'HTML', content: 'HTML structures a page.', level: 1 }],
    }))

    expect(result.notes).toHaveLength(1)
  })

  it('repairs unescaped quotes in ChatGPT HTML examples', () => {
    const malformed = `{
      "format": "reviewer-organizer-notes",
      "version": 1,
      "notes": [{
        "title": "HTML Attributes",
        "content": "Use name="value" and <input type="text">.",
        "level": 1
      }]
    }`

    const result = parseNoteImport(malformed)

    expect(result.notes[0].content).toBe('Use name="value" and <input type="text">.')
  })

  it('accepts an otherwise valid JSON response inside a code fence', () => {
    const fenced = '```json\n' + JSON.stringify({
      format: 'reviewer-organizer-notes',
      version: 1,
      notes: [{ title: 'Forms', content: 'Forms collect data.', level: 1 }],
    }) + '\n```'

    expect(parseNoteImport(fenced).notes[0].title).toBe('Forms')
  })

  it('accepts JSON surrounded by common ChatGPT commentary', () => {
    const wrapped = `Here are your organized notes:\n${JSON.stringify({
      format: 'reviewer-organizer-notes',
      version: 1,
      notes: [{ title: 'CSS', content: 'CSS styles the page.', level: 1 }],
    })}\nLet me know if you want more.`

    expect(parseNoteImport(wrapped).notes[0].title).toBe('CSS')
  })
})
