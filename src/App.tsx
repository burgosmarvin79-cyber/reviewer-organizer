import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft, BarChart3, BookOpen, Check, ChevronRight, CircleHelp, Clock3, Cloud,
  Download,
  FileText, GraduationCap, History, Home, Menu, NotebookPen, Pencil, Plus, Search,
  Settings, ShieldCheck, Trash2, Upload, X,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createBackup, restoreBackup, validateBackup } from './backup'
import { db, deleteSubjectCascade } from './db'
import { isAcceptedAnswer, LEVEL_NAMES, moveQuestion, randomSelection, recordAnswer } from './mastery'
import type { MasteryLevel, Note, Question, Subject, TestAnswer, TestSession } from './types'
import { supabase } from './lib/supabase'
import { enableUserSync, subscribeToUserChanges, syncUserData, unsubscribeFromUserChanges } from './sync'
import type { Session } from '@supabase/supabase-js'
import { deleteNote, deleteSubject, saveNote, saveSubject } from './remote'
import { createPdfOpenUrl, createPdfReviewer, deletePdfReviewer, deleteSubjectPdfs } from './pdf-storage'

const COLORS = ['#a51d25', '#7a171d', '#c74b50', '#d49a28', '#59636f', '#8b5e3c']

function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    void client.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    enableUserSync(userId)
    const refresh = () => { void syncUserData(userId).catch(() => undefined) }
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    subscribeToUserChanges(userId)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      unsubscribeFromUserChanges()
    }
  }, [userId])

  if (!supabase) return <div className="auth-screen"><section className="auth-card"><div className="brand auth-brand"><span className="brand-mark"><Check /></span><div><strong>Reviewer</strong><small>Organizer</small></div></div><p className="eyebrow">Secure study space</p><h1>Sign in to continue</h1><p>The app is ready for accounts, but the Supabase connection is not configured in this copy yet.</p><div className="notice">Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to this folder’s <code>.env.local</code>, then restart the dev server.</div></section></div>
  if (loading) return <div className="auth-screen"><div className="auth-card"><p>Loading your secure study space…</p></div></div>
  if (session) return <Layout userEmail={session.user.email} />

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('')
    const client = supabase
    if (!client) return
    const action = mode === 'sign-in' ? client.auth.signInWithPassword({ email, password }) : client.auth.signUp({ email, password })
    const { data, error: authError } = await action
    if (authError) return setError(authError.message)
    if (!data.session && mode === 'sign-up') setMessage('Account created. You can now sign in.')
  }
  return <div className="auth-screen"><section className="auth-card"><div className="brand auth-brand"><span className="brand-mark"><Check /></span><div><strong>Reviewer</strong><small>Organizer</small></div></div><p className="eyebrow">Private study space</p><h1>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'sign-in' ? 'Sign in to access your subjects and progress.' : 'Your reviewers and notes will be isolated to your account.'}</p><div className="auth-divider"><span>use your account</span></div><form className="form" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{error && <p className="form-error">{error}</p>}{message && <p className="notice">{message}</p>}<button className="button primary full">{mode === 'sign-in' ? 'Sign in' : 'Sign up'}</button></form><button className="text-button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage('') }}>{mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}</button></section></div>
}

function id() {
  return crypto.randomUUID()
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></header>
        {children}
      </section>
    </div>
  )
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>
}

function Layout({ userEmail }: { userEmail?: string } = {}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    { to: '/', label: 'Dashboard', icon: <Home /> },
    { to: '/subjects', label: 'Subjects', icon: <BookOpen /> },
    { to: '/history', label: 'Test history', icon: <History /> },
    { to: '/settings', label: 'Settings & backup', icon: <Settings /> },
  ]
  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />}
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand app-brand"><span className="brand-mark"><img src="/reviewer-organizer/batstateu-logo.png" alt="Batangas State University seal" /></span><div><strong>Reviewer Organizer</strong><small>Study workspace</small></div></div>
        <nav>{links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}>{link.icon}<span>{link.label}</span></NavLink>)}</nav>
        <div className="sidebar-footer">
          <div className="sync-badge"><Cloud /><span><strong>Private cloud sync</strong><small>Available offline on this device</small></span></div>
          {userEmail && <div className="account-card"><span className="account-avatar">{userEmail.charAt(0).toUpperCase()}</span><div><strong>{userEmail}</strong><small>Student account</small></div><button className="icon-button" onClick={() => void supabase?.auth.signOut()} aria-label="Sign out" title="Sign out"><ArrowLeft /></button></div>}
        </div>
      </aside>
      <main className="main-content">
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen}><Menu /></button>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:subjectId" element={<SubjectPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

function Dashboard() {
  const data = useLiveQuery(async () => {
    const [subjects, pdfs, notes, questions, sessions] = await Promise.all([
      db.subjects.toArray(), db.pdfs.toArray(), db.notes.toArray(), db.questions.toArray(), db.testSessions.reverse().sortBy('completedAt'),
    ])
    return { subjects, pdfs, notes, questions, sessions: sessions.reverse() }
  }, [])
  if (!data) return <p>Loading your study space…</p>
  const levelCounts = [1, 2, 3, 4].map((level) => data.questions.filter((question) => question.level === level).length)
  const average = data.sessions.length ? Math.round(data.sessions.reduce((sum, session) => sum + session.percentage, 0) / data.sessions.length) : 0
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Your study command center</p><h1>Ready for a focused session?</h1><p>Keep your reviewers organized and turn practice into measurable progress.</p></div><Link className="button primary" to="/subjects"><BookOpen /> Open subjects</Link></header>
      <section className="stats-grid">
        <article><span className="stat-icon blue"><BookOpen /></span><div><strong>{data.subjects.length}</strong><small>Subjects</small></div></article>
        <article><span className="stat-icon gold"><FileText /></span><div><strong>{data.pdfs.length}</strong><small>PDF reviewers</small></div></article>
        <article><span className="stat-icon violet"><CircleHelp /></span><div><strong>{data.questions.length}</strong><small>Questions</small></div></article>
        <article><span className="stat-icon green"><BarChart3 /></span><div><strong>{average}%</strong><small>Average score</small></div></article>
      </section>
      <div className="dashboard-grid">
        <section className="panel"><div className="section-heading"><div><p className="eyebrow">Mastery ladder</p><h2>Question progress</h2></div><Link to="/subjects">Choose subject <ChevronRight /></Link></div>
          {data.questions.length === 0 ? <EmptyState icon={<CircleHelp />} title="Your question bank is empty" text="Add questions inside a subject to begin building mastery." /> :
            <div className="mastery-bars">{levelCounts.map((count, index) => <div key={index}><div><span>{LEVEL_NAMES[(index + 1) as MasteryLevel]}</span><strong>{count}</strong></div><div className="bar"><i style={{ width: `${data.questions.length ? (count / data.questions.length) * 100 : 0}%` }} /></div></div>)}</div>}
        </section>
        <section className="panel"><div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent tests</h2></div><Link to="/history">All history <ChevronRight /></Link></div>
          {data.sessions.length === 0 ? <EmptyState icon={<Clock3 />} title="No tests yet" text="Your completed practice sessions will appear here." /> :
            <div className="activity-list">{data.sessions.slice(0, 5).map((session) => <article key={session.id}><span className={session.percentage >= 75 ? 'score good' : 'score'}>{session.percentage}%</span><div><strong>{session.subjectName}</strong><small>{LEVEL_NAMES[session.level]} · {dateLabel(session.completedAt)}</small></div></article>)}</div>}
        </section>
      </div>
      <section className="panel subjects-preview"><div className="section-heading"><div><p className="eyebrow">Your library</p><h2>Subjects</h2></div><Link to="/subjects">Manage subjects <ChevronRight /></Link></div>
        {data.subjects.length === 0 ? <EmptyState icon={<BookOpen />} title="Create your first subject" text="A subject keeps related PDFs, notes, and questions together." action={<Link className="button primary" to="/subjects"><Plus /> Add subject</Link>} /> :
          <div className="card-grid">{data.subjects.slice(0, 4).map((subject) => <SubjectCard key={subject.id} subject={subject} />)}</div>}
      </section>
    </div>
  )
}

function SubjectCard({ subject }: { subject: Subject }) {
  const counts = useLiveQuery(async () => ({
    pdfs: await db.pdfs.where('subjectId').equals(subject.id).count(),
    notes: await db.notes.where('subjectId').equals(subject.id).count(),
    questions: await db.questions.where('subjectId').equals(subject.id).count(),
  }), [subject.id])
  return <Link className="subject-card" to={`/subjects/${subject.id}`} style={{ '--subject-color': subject.color } as React.CSSProperties}>
    <div className="subject-card-banner"><span className="subject-card-icon"><BookOpen /></span><div><p>Subject workspace</p><h3>{subject.name}</h3></div></div>
    <div className="subject-card-content">
      <p>{subject.description || 'PDFs, notes, questions, and practice materials.'}</p>
      <div className="resource-summary" aria-label="Subject content summary">
        <span><FileText /><strong>{counts?.pdfs ?? 0}</strong><small>PDFs</small></span>
        <span><NotebookPen /><strong>{counts?.notes ?? 0}</strong><small>Notes</small></span>
        <span><CircleHelp /><strong>{counts?.questions ?? 0}</strong><small>Questions</small></span>
      </div>
      <footer><span>Open subject</span><ChevronRight /></footer>
    </div>
  </Link>
}

function SubjectForm({ subject, onClose }: { subject?: Subject; onClose: () => void }) {
  const [name, setName] = useState(subject?.name ?? '')
  const [description, setDescription] = useState(subject?.description ?? '')
  const [color, setColor] = useState(subject?.color ?? COLORS[0])
  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    const savedSubject = { id: subject?.id ?? id(), name: trimmed, description: description.trim(), color, createdAt: subject?.createdAt ?? now, updatedAt: now }
    await db.subjects.put(savedSubject)
    await saveSubject(savedSubject)
    onClose()
  }
  return <form className="form" onSubmit={submit}><label>Subject name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="e.g. General Biology" /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} placeholder="What are you studying?" /></label><fieldset><legend>Color</legend><div className="color-picker">{COLORS.map((item) => <button key={item} type="button" className={color === item ? 'selected' : ''} style={{ background: item }} onClick={() => setColor(item)} aria-label={`Choose ${item}`} />)}</div></fieldset><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary">{subject ? 'Save changes' : 'Create subject'}</button></div></form>
}

function SubjectsPage() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Subject | 'new' | null>(null)
  const subjects = useLiveQuery(() => db.subjects.orderBy('name').toArray(), []) ?? []
  const filtered = subjects.filter((subject) => `${subject.name} ${subject.description}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Study library</p><h1>Subjects</h1><p>Every subject contains its own PDF reviewers, notes, and question bank.</p></div><button className="button primary" onClick={() => setEditing('new')}><Plus /> Add subject</button></header><div className="toolbar"><label className="search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects" /></label></div>{filtered.length ? <div className="card-grid">{filtered.map((subject) => <SubjectCard key={subject.id} subject={subject} />)}</div> : <EmptyState icon={<BookOpen />} title={subjects.length ? 'No matching subjects' : 'No subjects yet'} text={subjects.length ? 'Try another search.' : 'Create a subject to organize your first study materials.'} action={!subjects.length ? <button className="button primary" onClick={() => setEditing('new')}><Plus /> Add subject</button> : undefined} />}{editing && <Modal title={editing === 'new' ? 'New subject' : 'Edit subject'} onClose={() => setEditing(null)}><SubjectForm subject={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /></Modal>}</div>
}

type SubjectTab = 'pdfs' | 'notes' | 'questions'

function SubjectPage() {
  const { subjectId = '' } = useParams()
  const [subjectParams] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<SubjectTab>(subjectParams.get('tab') === 'questions' ? 'questions' : 'pdfs')
  const [editing, setEditing] = useState(false)
  const subject = useLiveQuery(() => db.subjects.get(subjectId), [subjectId])
  if (subject === undefined) return <p>Loading subject…</p>
  if (!subject) return <EmptyState icon={<BookOpen />} title="Subject not found" text="It may have been deleted." action={<Link className="button primary" to="/subjects">Back to subjects</Link>} />
  const currentSubject = subject
  async function remove() {
    const confirmation = window.prompt(`Deleting this subject also deletes all of its PDFs, notes, questions, and test history. Type “${currentSubject.name}” to continue.`)
    if (confirmation !== currentSubject.name) return
    await deleteSubjectPdfs(currentSubject.id)
    await deleteSubjectCascade(currentSubject.id)
    await deleteSubject(currentSubject.id)
    navigate('/subjects')
  }
  return <div className="page"><Link className="back-link" to="/subjects"><ArrowLeft /> All subjects</Link><header className="subject-hero" style={{ '--subject-color': subject.color } as React.CSSProperties}><span><BookOpen /></span><div><p className="eyebrow">Subject workspace</p><h1>{subject.name}</h1><p>{subject.description || 'Add a description to explain this subject.'}</p></div><div className="hero-actions"><button className="button ghost" onClick={() => setEditing(true)}><Pencil /> Edit</button><button className="button danger" onClick={remove}><Trash2 /> Delete</button></div></header><div className="tabs" role="tablist"><button className={tab === 'pdfs' ? 'active' : ''} onClick={() => setTab('pdfs')}><FileText /> PDF reviewers</button><button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}><NotebookPen /> Notes</button><button className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}><CircleHelp /> Question bank</button></div>{tab === 'pdfs' && <PdfPanel subjectId={subject.id} />}{tab === 'notes' && <NotesPanel subjectId={subject.id} />}{tab === 'questions' && <QuestionsPanel subjectId={subject.id} />}{editing && <Modal title="Edit subject" onClose={() => setEditing(false)}><SubjectForm subject={subject} onClose={() => setEditing(false)} /></Modal>}</div>
}

function PdfPanel({ subjectId }: { subjectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const pdfs = useLiveQuery(() => db.pdfs.where('subjectId').equals(subjectId).reverse().sortBy('createdAt'), [subjectId]) ?? []
  async function addPdf(file?: File) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return window.alert('Please choose a PDF file.')
    if (file.size > 50 * 1024 * 1024) return window.alert('This PDF is larger than the 50 MB cloud-storage limit.')
    setBusy(true); setMessage('Uploading PDF to your private cloud storage…')
    try {
      await createPdfReviewer(subjectId, file)
      setMessage('PDF uploaded and available on your signed-in devices.')
    } catch (error) {
      setMessage(`${error instanceof Error ? error.message : 'Upload failed.'} The local copy is preserved and will retry when you reconnect.`)
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = '' }
  }
  async function openPdf(pdf: (typeof pdfs)[number]) {
    try { window.location.assign(await createPdfOpenUrl(pdf)) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not open this PDF.') }
  }
  async function removePdf(pdf: (typeof pdfs)[number]) {
    if (!window.confirm(`Delete ${pdf.name} from all your signed-in devices?`)) return
    try { await deletePdfReviewer(pdf); setMessage('PDF deleted from private cloud storage.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete this PDF.') }
  }
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Private cloud library</p><h2>PDF reviewers</h2></div><><input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => void addPdf(event.target.files?.[0])} /><button className="button primary" disabled={busy} onClick={() => inputRef.current?.click()}><Upload /> {busy ? 'Uploading…' : 'Add PDF'}</button></></div>{message && <div className="notice pdf-notice">{message}</div>}{pdfs.length ? <div className="document-list">{pdfs.map((pdf) => <article key={pdf.id}><span className="file-icon"><FileText /></span><div><strong>{pdf.name}</strong><small>{(pdf.size / 1024 / 1024).toFixed(1)} MB · {pdf.storagePath ? 'cloud synced' : 'waiting for upload'} · added {dateLabel(pdf.createdAt)}</small></div><button className="button ghost" disabled={!pdf.storagePath} onClick={() => void openPdf(pdf)}>Open</button><button className="icon-button danger-text" onClick={() => void removePdf(pdf)} aria-label={`Delete ${pdf.name}`}><Trash2 /></button></article>)}</div> : <EmptyState icon={<FileText />} title="No PDF reviewers" text="Upload a PDF once, then open it from any device signed in to your account." />}</section>
}

function NoteForm({ subjectId, note, onClose }: { subjectId: string; note?: Note; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true); const now = new Date().toISOString()
    const savedNote = { id: note?.id ?? id(), subjectId, title: title.trim(), content: content.trim(), createdAt: note?.createdAt ?? now, updatedAt: now }
    await db.notes.put(savedNote)
    try { await saveNote(savedNote); onClose() }
    catch (saveError) { setError(`${saveError instanceof Error ? saveError.message : 'Cloud save failed.'} The note remains saved on this device.`) }
    finally { setSaving(false) }
  }
  return <form className="form" onSubmit={submit}><label>Title<input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Notes<textarea className="large-textarea" required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your own explanation, summary, or reminder…" /></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</button></div></form>
}

function NotesPanel({ subjectId }: { subjectId: string }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Note | 'new' | null>(null)
  const notes = useLiveQuery(() => db.notes.where('subjectId').equals(subjectId).reverse().sortBy('updatedAt'), [subjectId]) ?? []
  const filtered = notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase()))
  async function removeNote(note: Note) {
    if (!window.confirm(`Delete “${note.title}” from all your signed-in devices?`)) return
    try { await deleteNote(note.id); await db.notes.delete(note.id) }
    catch (error) { window.alert(error instanceof Error ? error.message : 'Could not delete this note.') }
  }
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Your own words</p><h2>Notes</h2></div><button className="button primary" onClick={() => setEditing('new')}><Plus /> New note</button></div>{notes.length > 0 && <label className="search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" /></label>}{filtered.length ? <div className="note-grid">{filtered.map((note) => <article key={note.id}><div><h3>{note.title}</h3><small>Edited {dateLabel(note.updatedAt)}</small></div><p>{note.content}</p><footer><button className="button ghost" onClick={() => setEditing(note)}><Pencil /> Edit</button><button className="icon-button danger-text" onClick={() => void removeNote(note)}><Trash2 /></button></footer></article>)}</div> : <EmptyState icon={<NotebookPen />} title={notes.length ? 'No matching notes' : 'No notes yet'} text={notes.length ? 'Try another search.' : 'Write summaries in your own words to strengthen memory.'} />}{editing && <Modal title={editing === 'new' ? 'New note' : 'Edit note'} onClose={() => setEditing(null)}><NoteForm subjectId={subjectId} note={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /></Modal>}</section>
}

function QuestionForm({ subjectId, question, onClose }: { subjectId: string; question?: Question; onClose: () => void }) {
  const [prompt, setPrompt] = useState(question?.prompt ?? '')
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(question?.acceptedAnswers?.length ? question.acceptedAnswers : [''])
  const [error, setError] = useState('')
  function updateAnswer(index: number, value: string) { setAcceptedAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer)) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const cleaned = [...new Set(acceptedAnswers.map((answer) => answer.trim()).filter(Boolean))]
    if (!cleaned.length) return setError('Add at least one accepted answer.')
    const now = new Date().toISOString()
    await db.questions.put({ id: question?.id ?? id(), subjectId, prompt: prompt.trim(), acceptedAnswers: cleaned, explanation: explanation.trim(), level: question?.level ?? 1, totalAttempts: question?.totalAttempts ?? 0, totalCorrect: question?.totalCorrect ?? 0, lastAnsweredAt: question?.lastAnsweredAt, createdAt: question?.createdAt ?? now, updatedAt: now })
    onClose()
  }
  return <form className="form" onSubmit={submit}><label>Identification question<textarea autoFocus required value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. Who wrote Noli Me Tangere?" /></label><fieldset><legend>Accepted answers</legend><div className="answer-editor">{acceptedAnswers.map((answer, index) => <div key={index}><input value={answer} onChange={(event) => updateAnswer(index, event.target.value)} placeholder={index === 0 ? 'Primary correct answer' : 'Alternative accepted answer'} /><button type="button" className="icon-button" disabled={acceptedAnswers.length === 1} onClick={() => setAcceptedAnswers((current) => current.filter((_, answerIndex) => answerIndex !== index))}><X /></button></div>)}</div>{acceptedAnswers.length < 8 && <button type="button" className="text-button" onClick={() => setAcceptedAnswers([...acceptedAnswers, ''])}><Plus /> Add accepted answer</button>}<small>Capitalization and extra spaces are ignored. Add spelling variants when needed.</small></fieldset><label>Explanation<textarea required value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Explain the answer so the student can review it after checking." /></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary">Save question</button></div></form>
}

function QuestionsPanel({ subjectId }: { subjectId: string }) {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<MasteryLevel | 0>(0)
  const [editing, setEditing] = useState<Question | 'new' | null>(null)
  const questions = useLiveQuery(() => db.questions.where('subjectId').equals(subjectId).reverse().sortBy('updatedAt'), [subjectId]) ?? []
  const filtered = questions.filter((question) => (!level || question.level === level) && `${question.prompt} ${question.explanation}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Manual mastery practice</p><h2>Question bank</h2></div><button className="button primary" onClick={() => setEditing('new')}><Plus /> Add question</button></div><div className="test-level-grid">{([1, 2, 3, 4] as MasteryLevel[]).map((item) => { const count = questions.filter((question) => question.level === item).length; return <article key={item} className={`test-level-card level-card-${item}`}><div className={`level-pill level-${item}`}>{LEVEL_NAMES[item]}</div><strong>{count}</strong><span>{count === 1 ? 'question' : 'questions'}</span><Link className="button primary" aria-disabled={!count} to={count ? `/test?subject=${subjectId}&level=${item}` : '#'} onClick={(event) => { if (!count) event.preventDefault() }}><GraduationCap /> Start test</Link></article> })}</div>{questions.length > 0 && <div className="toolbar"><label className="search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" /></label><select value={level} onChange={(event) => setLevel(Number(event.target.value) as MasteryLevel | 0)}><option value={0}>All levels</option>{[1, 2, 3, 4].map((item) => <option key={item} value={item}>{LEVEL_NAMES[item as MasteryLevel]}</option>)}</select></div>}{filtered.length ? <div className="question-list">{filtered.map((question) => <article key={question.id}><div className={`level-pill level-${question.level}`}>{LEVEL_NAMES[question.level]}</div><h3>{question.prompt}</h3><p>{question.acceptedAnswers.length} accepted answer{question.acceptedAnswers.length === 1 ? '' : 's'} · {question.totalAttempts} attempts</p><footer><button className="button ghost" onClick={() => setEditing(question)}><Pencil /> Edit</button><button className="icon-button danger-text" onClick={() => window.confirm('Delete this question? Its snapshots remain in test history.') && void db.questions.delete(question.id)}><Trash2 /></button></footer></article>)}</div> : <EmptyState icon={<CircleHelp />} title={questions.length ? 'No matching questions' : 'No questions yet'} text={questions.length ? 'Adjust your search or level filter.' : 'Add identification questions to begin your manual mastery ladder.'} />}{editing && <Modal title={editing === 'new' ? 'New identification question' : 'Edit identification question'} onClose={() => setEditing(null)}><QuestionForm subjectId={subjectId} question={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /></Modal>}</section>
}

function TestPage() {
  const [params] = useSearchParams()
  const subjectId = params.get('subject') ?? ''
  const requestedLevel = Number(params.get('level'))
  const level = ([1, 2, 3, 4].includes(requestedLevel) ? requestedLevel : 1) as MasteryLevel
  const subject = useLiveQuery(async () => subjectId ? await db.subjects.get(subjectId) : undefined, [subjectId])
  const [size, setSize] = useState(10)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<TestAnswer[]>([])
  const [startedAt, setStartedAt] = useState('')
  const [completed, setCompleted] = useState<TestSession | null>(null)
  const available = useLiveQuery(() => subjectId ? db.questions.where('[subjectId+level]').equals([subjectId, level]).count() : Promise.resolve(0), [subjectId, level]) ?? 0
  const current = questions[index]
  async function start() {
    const pool = await db.questions.where('[subjectId+level]').equals([subjectId, level]).toArray()
    setQuestions(randomSelection(pool, size)); setIndex(0); setTypedAnswer(''); setChecked(false); setAnswers([]); setCompleted(null); setStartedAt(new Date().toISOString())
  }
  async function checkAnswer() {
    if (!current || !typedAnswer.trim() || checked) return
    const wasCorrect = isAcceptedAnswer(typedAnswer, current.acceptedAnswers)
    const updated = recordAnswer(current, wasCorrect)
    await db.questions.put(updated)
    const answer: TestAnswer = { questionId: current.id, prompt: current.prompt, selectedAnswer: typedAnswer.trim(), correctAnswer: current.acceptedAnswers[0], acceptedAnswers: current.acceptedAnswers, explanation: current.explanation, wasCorrect, levelBefore: current.level, levelAfter: current.level, answeredAt: new Date().toISOString() }
    setAnswers((items) => [...items, answer]); setChecked(true)
  }
  async function finishSession(finalAnswers: TestAnswer[]) {
    const answered = finalAnswers.filter((answer) => !answer.wasSkipped)
    const correctCount = answered.filter((answer) => answer.wasCorrect).length
    const session: TestSession = { id: id(), subjectId, subjectName: subject?.name ?? 'Deleted subject', level, startedAt, completedAt: new Date().toISOString(), questionCount: finalAnswers.length, correctCount, skippedCount: finalAnswers.length - answered.length, percentage: answered.length ? Math.round((correctCount / answered.length) * 100) : 0, answers: finalAnswers }
    await db.testSessions.add(session); setCompleted(session); setQuestions([])
  }
  async function advance(finalAnswers: TestAnswer[]) {
    if (index < questions.length - 1) { setAnswers(finalAnswers); setIndex(index + 1); setTypedAnswer(''); setChecked(false); return }
    await finishSession(finalAnswers)
  }
  async function chooseLevel(targetLevel: MasteryLevel) {
    if (!current || !checked) return
    await db.questions.put(moveQuestion(current, targetLevel))
    const finalAnswers = answers.map((answer, answerIndex) => answerIndex === answers.length - 1 ? { ...answer, levelAfter: targetLevel } : answer)
    await advance(finalAnswers)
  }
  async function skipQuestion() {
    if (!current || checked) return
    const skipped: TestAnswer = { questionId: current.id, prompt: current.prompt, selectedAnswer: '', correctAnswer: current.acceptedAnswers[0], acceptedAnswers: current.acceptedAnswers, explanation: current.explanation, wasCorrect: false, wasSkipped: true, levelBefore: current.level, levelAfter: current.level, answeredAt: new Date().toISOString() }
    await advance([...answers, skipped])
  }
  if (!subjectId || !params.get('level')) return <div className="page narrow"><EmptyState icon={<CircleHelp />} title="Choose a test inside a subject" text="Open a subject's Question Bank and select one of its four test levels." action={<Link className="button primary" to="/subjects">Open subjects</Link>} /></div>
  if (completed) return <div className="page narrow"><section className="result-card"><span className="result-icon"><GraduationCap /></span><p className="eyebrow">Test complete</p><h1>{completed.percentage}%</h1><p>{completed.correctCount} correct · {completed.skippedCount ?? 0} skipped · {completed.questionCount} total questions</p><div className="result-actions"><Link className="button primary" to={`/subjects/${subjectId}?tab=questions`}>Back to question bank</Link><Link className="button ghost" to="/history">View history</Link></div></section></div>
  if (!current) return <div className="page narrow"><Link className="back-link" to={`/subjects/${subjectId}?tab=questions`}><ArrowLeft /> Question bank</Link><header className="page-header"><div><p className="eyebrow">{subject?.name ?? 'Subject'} · identification</p><h1>{LEVEL_NAMES[level]}</h1><p>Questions are random. You decide whether each answered question stays here or moves to another level.</p></div></header><section className="panel setup-card"><label>Number of questions<input type="number" min={1} max={50} value={size} onChange={(event) => setSize(Math.max(1, Math.min(50, Number(event.target.value))))} /></label><div className="availability"><CircleHelp /><span>{available} question{available === 1 ? '' : 's'} available at this level</span></div><button className="button primary full" disabled={!available} onClick={() => void start()}><GraduationCap /> Begin identification test</button></section></div>
  const latestAnswer = answers.at(-1)
  return <div className="page narrow"><div className="test-progress"><span>Question {index + 1} of {questions.length}</span><div className="bar"><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><span>{LEVEL_NAMES[level]}</span></div><section className="question-card"><p className="eyebrow">Type your answer</p><h1>{current.prompt}</h1><form className="identification-form" onSubmit={(event) => { event.preventDefault(); void checkAnswer() }}><input autoFocus disabled={checked} value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} placeholder="Enter your answer" aria-label="Your answer" />{!checked && <div className="test-actions split"><button type="button" className="button ghost" onClick={() => void skipQuestion()}>Skip question</button><button className="button primary" disabled={!typedAnswer.trim()}>Check answer</button></div>}</form>{checked && latestAnswer && <><div className={latestAnswer.wasCorrect ? 'feedback correct' : 'feedback wrong'}><strong>{latestAnswer.wasCorrect ? 'Correct!' : 'Incorrect'}</strong><p>Correct answer: <b>{current.acceptedAnswers[0]}</b></p><p>{current.explanation}</p></div><div className="manual-level-controls"><p>Where should this question go next?</p><div><button className="button ghost" disabled={current.level === 1} onClick={() => void chooseLevel((current.level - 1) as MasteryLevel)}><ArrowLeft /> Previous level</button><button className="button ghost" onClick={() => void chooseLevel(current.level)}>Keep here</button><button className="button primary" disabled={current.level === 4} onClick={() => void chooseLevel((current.level + 1) as MasteryLevel)}>Next level <ChevronRight /></button></div></div></>}</section></div>
}

function HistoryPage() {
  const sessions = useLiveQuery(() => db.testSessions.orderBy('completedAt').reverse().toArray(), []) ?? []
  const [selected, setSelected] = useState<TestSession | null>(null)
  function responseText(answer: TestAnswer) { return answer.selectedAnswer || answer.choices?.find((choice) => choice.id === answer.selectedChoiceId)?.text || 'No answer' }
  function correctText(answer: TestAnswer) { return answer.correctAnswer || answer.choices?.find((choice) => choice.id === answer.correctChoiceId)?.text || 'Unavailable' }
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Learning record</p><h1>Test history</h1><p>Review scores, typed answers, skipped questions, and manual level decisions.</p></div></header>{sessions.length ? <div className="history-list">{sessions.map((session) => <button key={session.id} onClick={() => setSelected(session)}><span className={session.percentage >= 75 ? 'score good' : 'score'}>{session.percentage}%</span><div><strong>{session.subjectName}</strong><small>{LEVEL_NAMES[session.level]} · {dateLabel(session.completedAt)}{session.skippedCount ? ` · ${session.skippedCount} skipped` : ''}</small></div><div className="history-count">{session.correctCount}/{session.questionCount}<ChevronRight /></div></button>)}</div> : <EmptyState icon={<History />} title="No test history" text="Open a subject's Question Bank and complete an identification test." action={<Link className="button primary" to="/subjects">Open subjects</Link>} />}{selected && <Modal title={`${selected.subjectName} · ${selected.percentage}%`} onClose={() => setSelected(null)}><div className="history-detail"><p>{LEVEL_NAMES[selected.level]} · {dateLabel(selected.completedAt)} · {selected.correctCount} correct · {selected.skippedCount ?? 0} skipped</p>{selected.answers.map((answer, index) => <article key={`${answer.questionId}-${index}`}><span className={answer.wasSkipped ? 'answer-mark skipped' : answer.wasCorrect ? 'answer-mark correct' : 'answer-mark wrong'}>{answer.wasSkipped ? <ChevronRight /> : answer.wasCorrect ? <Check /> : <X />}</span><div><strong>{answer.prompt}</strong><p>{answer.wasSkipped ? 'Skipped without answering' : `Your answer: ${responseText(answer)}`}</p>{!answer.wasCorrect && !answer.wasSkipped && <p>Correct answer: {correctText(answer)}</p>}<small>{answer.explanation}</small>{answer.levelBefore !== answer.levelAfter && <small className="history-move">Moved from {LEVEL_NAMES[answer.levelBefore]} to {LEVEL_NAMES[answer.levelAfter]}</small>}</div></article>)}</div></Modal>}</div>
}

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const storageEstimate = useLiveQuery(async () => navigator.storage?.estimate?.(), [])
  async function downloadBackup() {
    setMessage('Preparing backup…'); const backup = await createBackup(); const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `reviewer-organizer-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); setMessage('Backup downloaded successfully.')
  }
  async function importBackup(file?: File) {
    if (!file) return
    try { const parsed: unknown = JSON.parse(await file.text()); validateBackup(parsed); if (!window.confirm('Restoring replaces all current study data. Continue?')) return; await restoreBackup(parsed); setMessage('Backup restored successfully.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not restore this backup.') } finally { if (fileRef.current) fileRef.current.value = '' }
  }
  async function requestPersistence() { const granted = await navigator.storage?.persist?.(); setMessage(granted ? 'Persistent storage is enabled.' : 'The browser did not grant persistent storage. Keep regular backups.') }
  const used = storageEstimate?.usage ? `${(storageEstimate.usage / 1024 / 1024).toFixed(1)} MB used` : 'Storage estimate unavailable'
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Data safety</p><h1>Settings & backup</h1><p>Your study records sync privately to your account, while backups provide an extra recovery copy.</p></div></header><div className="settings-grid"><section className="panel"><span className="setting-icon"><Download /></span><h2>Complete backup</h2><p>Download subjects, PDFs, notes, questions, progress, and test history into one file.</p><button className="button primary" onClick={() => void downloadBackup()}><Download /> Download backup</button></section><section className="panel"><span className="setting-icon"><Upload /></span><h2>Restore backup</h2><p>Replace the current database using a valid Reviewer Organizer backup.</p><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} /><button className="button ghost" onClick={() => fileRef.current?.click()}><Upload /> Choose backup</button></section><section className="panel"><span className="setting-icon"><ShieldCheck /></span><h2>Storage protection</h2><p>{used}. Ask the browser to reduce the chance of automatic cleanup.</p><button className="button ghost" onClick={() => void requestPersistence()}><ShieldCheck /> Request protection</button></section></div>{message && <div className="notice">{message}</div>}<section className="panel learn-card"><h2>Important to remember</h2><p>GitHub contains the app’s public source code—not your private study records. PDFs sync through private Supabase Storage, while local browser storage supports migration and offline metadata.</p></section></div>
}

export default function App() { return <AuthGate /> }
