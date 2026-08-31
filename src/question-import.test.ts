import { describe, expect, it } from 'vitest'
import { parseQuestionImport } from './question-import'

const valid = {
  format: 'reviewer-organizer-questions', version: 1,
  questions: [{ prompt: 'The basic unit of life is ____.', acceptedAnswers: ['cell', ' cell '], explanation: 'A cell is the basic unit of life.' }],
}

describe('question import validation', () => {
  it('parses valid JSON, cleans answers, and defaults to level 1', () => {
    expect(parseQuestionImport(JSON.stringify(valid)).questions).toEqual([{
      prompt: 'The basic unit of life is ____.', acceptedAnswers: ['cell'], explanation: 'A cell is the basic unit of life.', level: 1,
    }])
  })

  it('rejects non-JSON ChatGPT commentary', () => {
    expect(() => parseQuestionImport(`Here you go:\n${JSON.stringify(valid)}`)).toThrow('not valid JSON')
  })

  it('rejects a question without an accepted answer', () => {
    const input = { ...valid, questions: [{ ...valid.questions[0], acceptedAnswers: [] }] }
    expect(() => parseQuestionImport(JSON.stringify(input))).toThrow('at least one accepted answer')
  })

  it('skips duplicate prompts within one file', () => {
    const input = { ...valid, questions: [valid.questions[0], { ...valid.questions[0], prompt: '  THE basic unit of life is ____.  ' }] }
    const result = parseQuestionImport(JSON.stringify(input))
    expect(result.questions).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
  })
})
