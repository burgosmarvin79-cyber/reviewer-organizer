import { describe, expect, it, vi } from 'vitest'
import { extractDriveAttachments, listActiveCourses } from './google-classroom'

describe('Google Classroom import helpers', () => {
  it('deduplicates Drive attachments across Classroom items', () => {
    expect(extractDriveAttachments([
      { title: 'Week 1', materials: [{ driveFile: { id: 'pdf-1', title: 'Lesson.pdf' } }] },
      { title: 'Week 2', materials: [{ driveFile: { id: 'pdf-1', title: 'Lesson.pdf' } }, { driveFile: { id: 'pdf-2', title: 'Quiz.pdf' } }] },
    ])).toEqual([
      { fileId: 'pdf-1', title: 'Lesson.pdf', sourceTitle: 'Week 1' },
      { fileId: 'pdf-2', title: 'Quiz.pdf', sourceTitle: 'Week 2' },
    ])
  })
  it('collects every page of active courses', async () => {
    const fetchApi = vi.fn().mockResolvedValueOnce({ courses: [{ id: '1', name: 'Math' }], nextPageToken: 'next' }).mockResolvedValueOnce({ courses: [{ id: '2', name: 'Science' }] })
    await expect(listActiveCourses(fetchApi)).resolves.toHaveLength(2)
    expect(fetchApi).toHaveBeenLastCalledWith(expect.stringContaining('pageToken=next'))
  })
})
