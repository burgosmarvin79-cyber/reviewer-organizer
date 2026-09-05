import { useEffect, useState } from 'react'
import { Check, CloudDownload, LogOut, RefreshCw } from 'lucide-react'
import { listActiveCourses, listCourseAttachments, type ClassroomAttachment, type ClassroomCourse } from './google-classroom'
import { createPdfReviewer } from './pdf-storage'
import { useGoogleClassroom } from './use-google-classroom'

export function GoogleClassroomImport({ subjectId }: { subjectId: string }) {
  const google = useGoogleClassroom()
  const [courses, setCourses] = useState<ClassroomCourse[]>([])
  const [courseId, setCourseId] = useState('')
  const [attachments, setAttachments] = useState<ClassroomAttachment[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!google.connected) { setCourses([]); setCourseId(''); setAttachments([]); setSelected(new Set()); return }
    let cancelled = false
    setBusy(true)
    void listActiveCourses(google.fetchClassroomApi)
      .then((items) => { if (!cancelled) setCourses(items) })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : 'Could not load Google Classroom courses.') })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [google.connected, google.fetchClassroomApi])

  async function chooseCourse(nextCourseId: string) {
    setCourseId(nextCourseId); setAttachments([]); setSelected(new Set()); setMessage('')
    if (!nextCourseId) return
    setBusy(true)
    try {
      const items = await listCourseAttachments(google.fetchClassroomApi, nextCourseId)
      setAttachments(items)
      setSelected(new Set(items.filter((item) => item.title.toLowerCase().endsWith('.pdf')).map((item) => item.fileId)))
      if (!items.length) setMessage('No Google Drive attachments were found in this course.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load course attachments.') }
    finally { setBusy(false) }
  }

  function toggle(fileId: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(fileId)) next.delete(fileId); else next.add(fileId); return next })
  }

  async function importSelected() {
    const items = attachments.filter((item) => selected.has(item.fileId))
    if (!items.length) return
    setBusy(true); setMessage(`Importing ${items.length} Classroom attachment${items.length === 1 ? '' : 's'}…`)
    let imported = 0
    const failures: string[] = []
    for (const item of items) {
      try { await createPdfReviewer(subjectId, await google.downloadDriveFile(item.fileId)); imported += 1 }
      catch (error) { failures.push(error instanceof Error ? error.message : `Could not import “${item.title}”.`) }
    }
    setBusy(false)
    setMessage(failures.length ? `${imported} imported. ${failures.join(' ')}` : `${imported} PDF${imported === 1 ? '' : 's'} imported to this subject.`)
    if (imported) setSelected(new Set())
  }

  return (
    <section className="classroom-import">
      <div className="classroom-import-heading"><div><p className="eyebrow">Google Classroom</p><h3>Import course PDFs</h3><p>Choose attachments to copy into this subject’s private cloud library.</p></div>
        {google.connected ? <button className="button ghost" onClick={google.disconnect}><LogOut /> Disconnect</button> : <button className="button ghost" onClick={() => google.login()}><CloudDownload /> Connect Google</button>}
      </div>
      {(google.error || message) && <div className="notice">{google.error || message}</div>}
      {google.connected && <label className="classroom-course">Course<select value={courseId} disabled={busy} onChange={(event) => void chooseCourse(event.target.value)}><option value="">Select a Classroom course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.section ? ` · ${course.section}` : ''}</option>)}</select></label>}
      {busy && <p className="classroom-status"><RefreshCw className="spin" /> Contacting Google…</p>}
      {attachments.length > 0 && <><div className="classroom-files">{attachments.map((item) => <label key={item.fileId} className={selected.has(item.fileId) ? 'selected' : ''}><input type="checkbox" checked={selected.has(item.fileId)} onChange={() => toggle(item.fileId)} /><span><strong>{item.title}</strong><small>{item.sourceTitle}</small></span>{selected.has(item.fileId) && <Check />}</label>)}</div><button className="button primary" disabled={busy || !selected.size} onClick={() => void importSelected()}><CloudDownload /> Import {selected.size || ''} selected PDF{selected.size === 1 ? '' : 's'}</button></>}
      {!google.connected && <small className="classroom-privacy">Google access is read-only. The temporary token stays in memory and is cleared when you disconnect or refresh.</small>}
    </section>
  )
}
