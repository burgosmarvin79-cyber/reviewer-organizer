export interface ClassroomCourse { id: string; name: string; section?: string }

interface ClassroomDriveFile { driveFile?: { id?: string; title?: string } }
interface ClassroomItem { title?: string; materials?: ClassroomDriveFile[] }
interface CourseListResponse { courses?: ClassroomCourse[]; nextPageToken?: string }
interface ItemListResponse { courseWork?: ClassroomItem[]; courseWorkMaterial?: ClassroomItem[]; announcements?: ClassroomItem[]; nextPageToken?: string }

export interface ClassroomAttachment { fileId: string; title: string; sourceTitle: string }
export type ClassroomFetcher = <T>(endpoint: string) => Promise<T>

export async function listActiveCourses(fetchApi: ClassroomFetcher) {
  const courses: ClassroomCourse[] = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({ courseStates: 'ACTIVE', pageSize: '50' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await fetchApi<CourseListResponse>(`courses?${params}`)
    courses.push(...(data.courses ?? []))
    pageToken = data.nextPageToken ?? ''
  } while (pageToken)
  return courses
}

async function listCourseItems(fetchApi: ClassroomFetcher, courseId: string, resource: 'courseWork' | 'courseWorkMaterials' | 'announcements') {
  const items: ClassroomItem[] = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await fetchApi<ItemListResponse>(`courses/${encodeURIComponent(courseId)}/${resource}?${params}`)
    items.push(...(resource === 'courseWork' ? data.courseWork ?? [] : resource === 'courseWorkMaterials' ? data.courseWorkMaterial ?? [] : data.announcements ?? []))
    pageToken = data.nextPageToken ?? ''
  } while (pageToken)
  return items
}

export function extractDriveAttachments(items: ClassroomItem[]) {
  const attachments: ClassroomAttachment[] = []
  const seen = new Set<string>()
  for (const item of items) {
    for (const material of item.materials ?? []) {
      const fileId = material.driveFile?.id
      if (!fileId || seen.has(fileId)) continue
      seen.add(fileId)
      attachments.push({ fileId, title: material.driveFile?.title?.trim() || 'Classroom attachment', sourceTitle: item.title?.trim() || 'Classroom material' })
    }
  }
  return attachments
}

export async function listCourseAttachments(fetchApi: ClassroomFetcher, courseId: string) {
  const [coursework, materials, announcements] = await Promise.all([
    listCourseItems(fetchApi, courseId, 'courseWork'),
    listCourseItems(fetchApi, courseId, 'courseWorkMaterials'),
    listCourseItems(fetchApi, courseId, 'announcements'),
  ])
  return extractDriveAttachments([...coursework, ...materials, ...announcements])
}
