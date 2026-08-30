import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft, BarChart3, BookOpen, Check, ChevronRight, CircleHelp, Clock3, Download,
  FileText, GraduationCap, History, Home, Menu, NotebookPen, Pencil, Plus, Search,
  Settings, ShieldCheck, Trash2, Upload, X,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createBackup, restoreBackup, validateBackup } from './backup'
import { db, deleteSubjectCascade } from './db'
import { applyAnswer, LEVEL_NAMES, randomSelection } from './mastery'
import type { Choice, MasteryLevel, Note, Question, Subject, TestAnswer, TestSession } from './types'

const COLORS = ['#246bfd', '#16a085', '#7c5ce7', '#e67e22', '#d64f6c', '#1f8a99']

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

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    { to: '/', label: 'Dashboard', icon: <Home /> },
    { to: '/subjects', label: 'Subjects', icon: <BookOpen /> },
    { to: '/test', label: 'Practice test', icon: <GraduationCap /> },
    { to: '/history', label: 'Test history', icon: <History /> },
    { to: '/settings', label: 'Settings & backup', icon: <Settings /> },
  ]
  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />}
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand"><span className="brand-mark"><Check /></span><div><strong>Reviewer</strong><small>Organizer</small></div></div>
        <nav>{links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}>{link.icon}<span>{link.label}</span></NavLink>)}</nav>
        <div className="offline-badge"><ShieldCheck /><span><strong>Stored locally</strong><small>Your study data stays here.</small></span></div>
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
      <header className="page-header"><div><p className="eyebrow">Your study command center</p><h1>Ready for a focused session?</h1><p>Keep your reviewers organized and turn practice into measurable progress.</p></div><Link className="button primary" to="/test"><GraduationCap /> Start a test</Link></header>
      <section className="stats-grid">
        <article><span className="stat-icon blue"><BookOpen /></span><div><strong>{data.subjects.length}</strong><small>Subjects</small></div></article>
        <article><span className="stat-icon gold"><FileText /></span><div><strong>{data.pdfs.length}</strong><small>PDF reviewers</small></div></article>
        <article><span className="stat-icon violet"><CircleHelp /></span><div><strong>{data.questions.length}</strong><small>Questions</small></div></article>
        <article><span className="stat-icon green"><BarChart3 /></span><div><strong>{average}%</strong><small>Average score</small></div></article>
      </section>
      <div className="dashboard-grid">
        <section className="panel"><div className="section-heading"><div><p className="eyebrow">Mastery ladder</p><h2>Question progress</h2></div><Link to="/test">Practice <ChevronRight /></Link></div>
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
  return <Link className="subject-card" to={`/subjects/${subject.id}`}><span className="subject-color" style={{ background: subject.color }}><BookOpen /></span><div><h3>{subject.name}</h3><p>{subject.description || 'No description yet.'}</p><small>{counts?.pdfs ?? 0} PDFs · {counts?.notes ?? 0} notes · {counts?.questions ?? 0} questions</small></div><ChevronRight /></Link>
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
    await db.subjects.put({ id: subject?.id ?? id(), name: trimmed, description: description.trim(), color, createdAt: subject?.createdAt ?? now, updatedAt: now })
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
  const navigate = useNavigate()
  const [tab, setTab] = useState<SubjectTab>('pdfs')
  const [editing, setEditing] = useState(false)
  const subject = useLiveQuery(() => db.subjects.get(subjectId), [subjectId])
  if (subject === undefined) return <p>Loading subject…</p>
  if (!subject) return <EmptyState icon={<BookOpen />} title="Subject not found" text="It may have been deleted." action={<Link className="button primary" to="/subjects">Back to subjects</Link>} />
  const currentSubject = subject
  async function remove() {
    const confirmation = window.prompt(`Deleting this subject also deletes all of its PDFs, notes, questions, and test history. Type “${currentSubject.name}” to continue.`)
    if (confirmation !== currentSubject.name) return
    await deleteSubjectCascade(currentSubject.id)
    navigate('/subjects')
  }
  return <div className="page"><Link className="back-link" to="/subjects"><ArrowLeft /> All subjects</Link><header className="subject-hero" style={{ '--subject-color': subject.color } as React.CSSProperties}><span><BookOpen /></span><div><p className="eyebrow">Subject workspace</p><h1>{subject.name}</h1><p>{subject.description || 'Add a description to explain this subject.'}</p></div><div className="hero-actions"><button className="button ghost" onClick={() => setEditing(true)}><Pencil /> Edit</button><button className="button danger" onClick={remove}><Trash2 /> Delete</button></div></header><div className="tabs" role="tablist"><button className={tab === 'pdfs' ? 'active' : ''} onClick={() => setTab('pdfs')}><FileText /> PDF reviewers</button><button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}><NotebookPen /> Notes</button><button className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}><CircleHelp /> Question bank</button></div>{tab === 'pdfs' && <PdfPanel subjectId={subject.id} />}{tab === 'notes' && <NotesPanel subjectId={subject.id} />}{tab === 'questions' && <QuestionsPanel subjectId={subject.id} />}{editing && <Modal title="Edit subject" onClose={() => setEditing(false)}><SubjectForm subject={subject} onClose={() => setEditing(false)} /></Modal>}</div>
}

function PdfPanel({ subjectId }: { subjectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pdfs = useLiveQuery(() => db.pdfs.where('subjectId').equals(subjectId).reverse().sortBy('createdAt'), [subjectId]) ?? []
  async function addPdf(file?: File) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return window.alert('Please choose a PDF file.')
    if (file.size > 100 * 1024 * 1024) return window.alert('This PDF is larger than the 100 MB limit.')
    if (file.size > 25 * 1024 * 1024 && !window.confirm('This PDF is larger than 25 MB and may use significant device storage. Add it anyway?')) return
    await db.pdfs.add({ id: id(), subjectId, name: file.name, fileData: file, mimeType: 'application/pdf', size: file.size, createdAt: new Date().toISOString() })
    if (inputRef.current) inputRef.current.value = ''
  }
  function openPdf(fileData: Blob) {
    const url = URL.createObjectURL(fileData)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Offline library</p><h2>PDF reviewers</h2></div><><input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => void addPdf(event.target.files?.[0])} /><button className="button primary" onClick={() => inputRef.current?.click()}><Upload /> Add PDF</button></></div>{pdfs.length ? <div className="document-list">{pdfs.map((pdf) => <article key={pdf.id}><span className="file-icon"><FileText /></span><div><strong>{pdf.name}</strong><small>{(pdf.size / 1024 / 1024).toFixed(1)} MB · added {dateLabel(pdf.createdAt)}</small></div><button className="button ghost" onClick={() => openPdf(pdf.fileData)}>Open</button><button className="icon-button danger-text" onClick={() => window.confirm(`Delete ${pdf.name}?`) && void db.pdfs.delete(pdf.id)} aria-label={`Delete ${pdf.name}`}><Trash2 /></button></article>)}</div> : <EmptyState icon={<FileText />} title="No PDF reviewers" text="Add course handouts, modules, or reviewer files for offline access." />}</section>
}

function NoteForm({ subjectId, note, onClose }: { subjectId: string; note?: Note; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  async function submit(event: FormEvent) {
    event.preventDefault(); const now = new Date().toISOString()
    await db.notes.put({ id: note?.id ?? id(), subjectId, title: title.trim(), content: content.trim(), createdAt: note?.createdAt ?? now, updatedAt: now }); onClose()
  }
  return <form className="form" onSubmit={submit}><label>Title<input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Notes<textarea className="large-textarea" required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your own explanation, summary, or reminder…" /></label><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary">Save note</button></div></form>
}

function NotesPanel({ subjectId }: { subjectId: string }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Note | 'new' | null>(null)
  const notes = useLiveQuery(() => db.notes.where('subjectId').equals(subjectId).reverse().sortBy('updatedAt'), [subjectId]) ?? []
  const filtered = notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Your own words</p><h2>Notes</h2></div><button className="button primary" onClick={() => setEditing('new')}><Plus /> New note</button></div>{notes.length > 0 && <label className="search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" /></label>}{filtered.length ? <div className="note-grid">{filtered.map((note) => <article key={note.id}><div><h3>{note.title}</h3><small>Edited {dateLabel(note.updatedAt)}</small></div><p>{note.content}</p><footer><button className="button ghost" onClick={() => setEditing(note)}><Pencil /> Edit</button><button className="icon-button danger-text" onClick={() => window.confirm(`Delete “${note.title}”?`) && void db.notes.delete(note.id)}><Trash2 /></button></footer></article>)}</div> : <EmptyState icon={<NotebookPen />} title={notes.length ? 'No matching notes' : 'No notes yet'} text={notes.length ? 'Try another search.' : 'Write summaries in your own words to strengthen memory.'} />}{editing && <Modal title={editing === 'new' ? 'New note' : 'Edit note'} onClose={() => setEditing(null)}><NoteForm subjectId={subjectId} note={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /></Modal>}</section>
}

function blankChoices(): Choice[] { return [{ id: id(), text: '' }, { id: id(), text: '' }, { id: id(), text: '' }, { id: id(), text: '' }] }

function QuestionForm({ subjectId, question, onClose }: { subjectId: string; question?: Question; onClose: () => void }) {
  const [prompt, setPrompt] = useState(question?.prompt ?? '')
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [choices, setChoices] = useState<Choice[]>(question?.choices ?? blankChoices())
  const [correctChoiceId, setCorrectChoiceId] = useState(question?.correctChoiceId ?? '')
  const [error, setError] = useState('')
  function updateChoice(choiceId: string, text: string) { setChoices((current) => current.map((choice) => choice.id === choiceId ? { ...choice, text } : choice)) }
  async function submit(event: FormEvent) {
    event.preventDefault(); const cleaned = choices.map((choice) => ({ ...choice, text: choice.text.trim() })).filter((choice) => choice.text)
    if (cleaned.length < 2) return setError('Add at least two answer choices.')
    if (!cleaned.some((choice) => choice.id === correctChoiceId)) return setError('Choose the correct answer.')
    const now = new Date().toISOString(); const answerChanged = question && question.correctChoiceId !== correctChoiceId
    await db.questions.put({ id: question?.id ?? id(), subjectId, prompt: prompt.trim(), choices: cleaned, correctChoiceId, explanation: explanation.trim(), level: answerChanged ? 1 : question?.level ?? 1, correctStreak: answerChanged ? 0 : question?.correctStreak ?? 0, totalAttempts: answerChanged ? 0 : question?.totalAttempts ?? 0, totalCorrect: answerChanged ? 0 : question?.totalCorrect ?? 0, lastAnsweredAt: answerChanged ? undefined : question?.lastAnsweredAt, createdAt: question?.createdAt ?? now, updatedAt: now }); onClose()
  }
  return <form className="form" onSubmit={submit}><label>Question<textarea autoFocus required value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What do you want to remember?" /></label><fieldset><legend>Answer choices</legend><div className="choice-editor">{choices.map((choice, index) => <div key={choice.id}><input type="radio" name="correct" checked={correctChoiceId === choice.id} onChange={() => setCorrectChoiceId(choice.id)} aria-label={`Mark choice ${index + 1} correct`} /><input value={choice.text} onChange={(event) => updateChoice(choice.id, event.target.value)} placeholder={`Choice ${index + 1}`} /><button type="button" className="icon-button" disabled={choices.length <= 2} onClick={() => { setChoices((current) => current.filter((item) => item.id !== choice.id)); if (correctChoiceId === choice.id) setCorrectChoiceId('') }}><X /></button></div>)}</div>{choices.length < 6 && <button type="button" className="text-button" onClick={() => setChoices([...choices, { id: id(), text: '' }])}><Plus /> Add choice</button>}<small>Select the circle beside the correct answer.</small></fieldset><label>Explanation<textarea required value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Explain why the correct answer is right." /></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary">Save question</button></div></form>
}

function QuestionsPanel({ subjectId }: { subjectId: string }) {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<MasteryLevel | 0>(0)
  const [editing, setEditing] = useState<Question | 'new' | null>(null)
  const questions = useLiveQuery(() => db.questions.where('subjectId').equals(subjectId).reverse().sortBy('updatedAt'), [subjectId]) ?? []
  const filtered = questions.filter((question) => (!level || question.level === level) && `${question.prompt} ${question.explanation}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">Mastery practice</p><h2>Question bank</h2></div><div className="heading-actions"><Link className="button ghost" to={`/test?subject=${subjectId}`}><GraduationCap /> Practice</Link><button className="button primary" onClick={() => setEditing('new')}><Plus /> Add question</button></div></div>{questions.length > 0 && <div className="toolbar"><label className="search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" /></label><select value={level} onChange={(event) => setLevel(Number(event.target.value) as MasteryLevel | 0)}><option value={0}>All levels</option>{[1, 2, 3, 4].map((item) => <option key={item} value={item}>{LEVEL_NAMES[item as MasteryLevel]}</option>)}</select></div>}{filtered.length ? <div className="question-list">{filtered.map((question) => <article key={question.id}><div className={`level-pill level-${question.level}`}>{LEVEL_NAMES[question.level]}</div><h3>{question.prompt}</h3><p>{question.choices.length} choices · {question.correctStreak}/3 correct streak · {question.totalAttempts} attempts</p><footer><button className="button ghost" onClick={() => setEditing(question)}><Pencil /> Edit</button><button className="icon-button danger-text" onClick={() => window.confirm('Delete this question? Its snapshots remain in test history.') && void db.questions.delete(question.id)}><Trash2 /></button></footer></article>)}</div> : <EmptyState icon={<CircleHelp />} title={questions.length ? 'No matching questions' : 'No questions yet'} text={questions.length ? 'Adjust your search or level filter.' : 'Add multiple-choice questions to begin your mastery ladder.'} />}{editing && <Modal title={editing === 'new' ? 'New question' : 'Edit question'} onClose={() => setEditing(null)}><QuestionForm subjectId={subjectId} question={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /></Modal>}</section>
}

function TestPage() {
  const [params] = useSearchParams()
  const subjects = useLiveQuery(() => db.subjects.orderBy('name').toArray(), []) ?? []
  const [subjectId, setSubjectId] = useState(params.get('subject') ?? '')
  const [level, setLevel] = useState<MasteryLevel>(1)
  const [size, setSize] = useState(10)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<TestAnswer[]>([])
  const [startedAt, setStartedAt] = useState('')
  const [completed, setCompleted] = useState<TestSession | null>(null)
  const available = useLiveQuery(() => subjectId ? db.questions.where('[subjectId+level]').equals([subjectId, level]).count() : Promise.resolve(0), [subjectId, level]) ?? 0
  const current = questions[index]
  async function start() {
    const pool = await db.questions.where('[subjectId+level]').equals([subjectId, level]).toArray()
    setQuestions(randomSelection(pool, size)); setIndex(0); setSelected(''); setChecked(false); setAnswers([]); setCompleted(null); setStartedAt(new Date().toISOString())
  }
  async function checkAnswer() {
    if (!current || !selected || checked) return
    const wasCorrect = selected === current.correctChoiceId
    const updated = applyAnswer(current, wasCorrect)
    await db.questions.put(updated)
    const answer: TestAnswer = { questionId: current.id, prompt: current.prompt, choices: current.choices, selectedChoiceId: selected, correctChoiceId: current.correctChoiceId, explanation: current.explanation, wasCorrect, levelBefore: current.level, levelAfter: updated.level, answeredAt: new Date().toISOString() }
    setAnswers((items) => [...items, answer]); setChecked(true)
  }
  async function next() {
    if (index < questions.length - 1) { setIndex(index + 1); setSelected(''); setChecked(false); return }
    const allAnswers = answers
    const subject = subjects.find((item) => item.id === subjectId)
    const correctCount = allAnswers.filter((answer) => answer.wasCorrect).length
    const session: TestSession = { id: id(), subjectId, subjectName: subject?.name ?? 'Deleted subject', level, startedAt, completedAt: new Date().toISOString(), questionCount: allAnswers.length, correctCount, percentage: Math.round((correctCount / allAnswers.length) * 100), answers: allAnswers }
    await db.testSessions.add(session); setCompleted(session); setQuestions([])
  }
  if (completed) return <div className="page narrow"><section className="result-card"><span className="result-icon"><GraduationCap /></span><p className="eyebrow">Test complete</p><h1>{completed.percentage}%</h1><p>You answered {completed.correctCount} of {completed.questionCount} questions correctly.</p><div className="result-actions"><button className="button primary" onClick={() => setCompleted(null)}>Practice again</button><Link className="button ghost" to="/history">View history</Link></div></section></div>
  if (!current) return <div className="page narrow"><header className="page-header"><div><p className="eyebrow">Mastery practice</p><h1>Start a practice test</h1><p>Choose one subject and one level. Questions are selected randomly without repeats.</p></div></header><section className="panel setup-card"><label>Subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label><label>Test level<select value={level} onChange={(event) => setLevel(Number(event.target.value) as MasteryLevel)}>{[1, 2, 3, 4].map((item) => <option key={item} value={item}>{LEVEL_NAMES[item as MasteryLevel]}</option>)}</select></label><label>Number of questions<input type="number" min={1} max={50} value={size} onChange={(event) => setSize(Math.max(1, Math.min(50, Number(event.target.value))))} /></label><div className="availability"><CircleHelp /><span>{subjectId ? `${available} question${available === 1 ? '' : 's'} available at this level` : 'Choose a subject to see available questions'}</span></div><button className="button primary full" disabled={!subjectId || !available} onClick={() => void start()}><GraduationCap /> Begin test</button></section></div>
  const selectedChoice = current.choices.find((choice) => choice.id === selected)
  const correct = selected === current.correctChoiceId
  return <div className="page narrow"><div className="test-progress"><span>Question {index + 1} of {questions.length}</span><div className="bar"><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><span>{LEVEL_NAMES[level]}</span></div><section className="question-card"><p className="eyebrow">Choose the best answer</p><h1>{current.prompt}</h1><div className="answer-list">{current.choices.map((choice, choiceIndex) => { const isCorrect = checked && choice.id === current.correctChoiceId; const isWrong = checked && choice.id === selected && !correct; return <button key={choice.id} disabled={checked} className={`${selected === choice.id ? 'selected ' : ''}${isCorrect ? 'correct ' : ''}${isWrong ? 'wrong' : ''}`} onClick={() => setSelected(choice.id)}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice.text}{isCorrect && <Check />}{isWrong && <X />}</button> })}</div>{checked && <div className={correct ? 'feedback correct' : 'feedback wrong'}><strong>{correct ? 'Correct!' : `Not quite. You chose “${selectedChoice?.text}”.`}</strong><p>{current.explanation}</p>{answers.at(-1)?.levelBefore !== answers.at(-1)?.levelAfter && <small>Your question moved to {LEVEL_NAMES[answers.at(-1)!.levelAfter]}.</small>}</div>}<div className="test-actions">{!checked ? <button className="button primary" disabled={!selected} onClick={() => void checkAnswer()}>Check answer</button> : <button className="button primary" onClick={() => void next()}>{index === questions.length - 1 ? 'Finish test' : 'Next question'} <ChevronRight /></button>}</div></section></div>
}

function HistoryPage() {
  const sessions = useLiveQuery(() => db.testSessions.orderBy('completedAt').reverse().toArray(), []) ?? []
  const [selected, setSelected] = useState<TestSession | null>(null)
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Learning record</p><h1>Test history</h1><p>Review scores and the exact questions answered in each completed test.</p></div></header>{sessions.length ? <div className="history-list">{sessions.map((session) => <button key={session.id} onClick={() => setSelected(session)}><span className={session.percentage >= 75 ? 'score good' : 'score'}>{session.percentage}%</span><div><strong>{session.subjectName}</strong><small>{LEVEL_NAMES[session.level]} · {dateLabel(session.completedAt)}</small></div><div className="history-count">{session.correctCount}/{session.questionCount}<ChevronRight /></div></button>)}</div> : <EmptyState icon={<History />} title="No test history" text="Complete a practice test to create your first learning record." action={<Link className="button primary" to="/test">Start a test</Link>} />}{selected && <Modal title={`${selected.subjectName} · ${selected.percentage}%`} onClose={() => setSelected(null)}><div className="history-detail"><p>{LEVEL_NAMES[selected.level]} · {dateLabel(selected.completedAt)} · {selected.correctCount} of {selected.questionCount} correct</p>{selected.answers.map((answer, index) => <article key={`${answer.questionId}-${index}`}><span className={answer.wasCorrect ? 'answer-mark correct' : 'answer-mark wrong'}>{answer.wasCorrect ? <Check /> : <X />}</span><div><strong>{answer.prompt}</strong><p>Your answer: {answer.choices.find((choice) => choice.id === answer.selectedChoiceId)?.text}</p>{!answer.wasCorrect && <p>Correct answer: {answer.choices.find((choice) => choice.id === answer.correctChoiceId)?.text}</p>}<small>{answer.explanation}</small></div></article>)}</div></Modal>}</div>
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
  return <div className="page"><header className="page-header"><div><p className="eyebrow">Data safety</p><h1>Settings & backup</h1><p>Your study data is local. Regular backups protect it from browser-data removal or device loss.</p></div></header><div className="settings-grid"><section className="panel"><span className="setting-icon"><Download /></span><h2>Complete backup</h2><p>Download subjects, PDFs, notes, questions, progress, and test history into one file.</p><button className="button primary" onClick={() => void downloadBackup()}><Download /> Download backup</button></section><section className="panel"><span className="setting-icon"><Upload /></span><h2>Restore backup</h2><p>Replace the current database using a valid Reviewer Organizer backup.</p><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} /><button className="button ghost" onClick={() => fileRef.current?.click()}><Upload /> Choose backup</button></section><section className="panel"><span className="setting-icon"><ShieldCheck /></span><h2>Storage protection</h2><p>{used}. Ask the browser to reduce the chance of automatic cleanup.</p><button className="button ghost" onClick={() => void requestPersistence()}><ShieldCheck /> Request protection</button></section></div>{message && <div className="notice">{message}</div>}<section className="panel learn-card"><h2>Important to remember</h2><p>GitHub contains the app’s public source code—not your private PDFs, notes, questions, or scores. Your study content remains in this browser unless you export a backup.</p></section></div>
}

export default function App() { return <Layout /> }
