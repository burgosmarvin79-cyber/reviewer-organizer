import { describe, expect, it, vi } from 'vitest'
import { extractDriveAttachments, listActiveCourses, listCourseAttachments } from './google-classroom'

describe('Google Classroom import helpers', () => {
  it('deduplicates Drive attachments across Classroom items', () => {
    expect(extractDriveAttachments([
      { title: 'Week 1', materials: [{ driveFile: { driveFile: { id: 'pdf-1', title: 'Lesson.pdf' } } }] },
      { title: 'Week 2', materials: [{ driveFile: { driveFile: { id: 'pdf-1', title: 'Lesson.pdf' } } }, { driveFile: { driveFile: { id: 'pdf-2', title: 'Quiz.pdf' } } }] },
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

  it('includes attachments posted as Classroom announcements', async () => {
    const fetchApi = vi.fn()
      .mockResolvedValueOnce({ courseWork: [] })
      .mockResolvedValueOnce({ courseWorkMaterial: [] })
      .mockResolvedValueOnce({ announcements: [{ text: 'Read this', materials: [{ driveFile: { driveFile: { id: 'stream-pdf', title: 'Stream lesson.pdf' } } }] }] })
    await expect(listCourseAttachments(fetchApi, 'course-1')).resolves.toEqual([
      { fileId: 'stream-pdf', title: 'Stream lesson.pdf', sourceTitle: 'Classroom material' },
    ])
    expect(fetchApi).toHaveBeenCalledWith(expect.stringContaining('/announcements?'))
  })

  it('keeps readable attachments when one Classroom content type is blocked', async () => {
    const fetchApi = vi.fn()
      .mockResolvedValueOnce({ courseWork: [{ title: 'Lesson', materials: [{ driveFile: { driveFile: { id: 'pdf-1', title: 'Lesson.pdf' } } }] }] })
      .mockResolvedValueOnce({ courseWorkMaterial: [] })
      .mockRejectedValueOnce(new Error('Announcements scope missing'))
    await expect(listCourseAttachments(fetchApi, 'course-1')).resolves.toHaveLength(1)
  })
})
