import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ArrowRight, Award, Bell, ChevronDown, CircleCheck, Circle, ClipboardList, ListChecks, Menu, PlayCircle,
  RotateCcw, Trophy, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, formatDate, formatDateTime, formatMinutes, timeAgo } from '../../lib/utils'
import { Logo, Markdown, VideoEmbed } from '../../components/shared'
import { Badge, Button, Card, EmptyState, Input, PageLoader, ProgressBar, StatusBadge, Textarea } from '../../components/ui'

export default function CoursePlayer() {
  const { slug } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({})

  const { data, loading, reload, setData } = useQuery(async () => {
    const course = unwrap(
      await supabase
        .from('courses')
        .select('id, title, slug, teacher_id, status, teacher:profiles!courses_teacher_id_fkey(full_name), modules(id, title, position, lessons(id, title, video_url, content, duration_minutes, position)), quizzes(id, title, description, pass_percent, module_id, position)')
        .eq('slug', slug)
        .maybeSingle(),
    )
    if (!course) return null
    course.modules.sort((a, b) => a.position - b.position).forEach((m) => m.lessons.sort((a, b) => a.position - b.position))
    course.quizzes.sort((a, b) => a.position - b.position)
    const [enrollment, progress, attempts, certificate] = await Promise.all([
      supabase.from('enrollments').select('id, completed_at').eq('course_id', course.id).eq('student_id', user.id).maybeSingle(),
      supabase.from('lesson_progress').select('lesson_id').eq('course_id', course.id).eq('student_id', user.id),
      supabase.from('quiz_attempts').select('quiz_id, passed, percent, created_at').eq('student_id', user.id).in('quiz_id', course.quizzes.map((q) => q.id).concat('00000000-0000-0000-0000-000000000000')),
      supabase.from('certificates').select('code').eq('course_id', course.id).eq('student_id', user.id).maybeSingle(),
    ])
    return {
      course,
      enrolled: !!enrollment.data,
      done: new Set((progress.data || []).map((p) => p.lesson_id)),
      attempts: attempts.data || [],
      certificate: certificate.data,
    }
  }, [slug, user.id])

  const lessons = useMemo(() => data?.course?.modules.flatMap((m) => m.lessons) ?? [], [data])
  const selectedLessonId = params.get('lesson')
  const selectedQuizId = params.get('quiz')
  const view = params.get('view') || (selectedQuizId ? 'quiz' : 'lesson')

  // Default to the first unfinished lesson.
  useEffect(() => {
    if (!data?.course || selectedLessonId || selectedQuizId || params.get('view')) return
    const next = lessons.find((l) => !data.done.has(l.id)) || lessons[0]
    if (next) setParams({ lesson: next.id }, { replace: true })
  }, [data, lessons, selectedLessonId, selectedQuizId, params, setParams])

  useEffect(() => {
    setSidebarOpen(false)
  }, [params])

  if (loading) return <PageLoader />
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState title="Course not found" action={<Button to="/student/courses">My courses</Button>} />
      </div>
    )
  }

  const { course, enrolled, done, attempts, certificate } = data
  const canPreview = isAdmin || course.teacher_id === user.id
  if (!enrolled && !canPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          title="Enroll to start learning"
          description={`You're not enrolled in "${course.title}" yet. It's free!`}
          action={<Button to={`/courses/${course.slug}`}>Go to course page</Button>}
        />
      </div>
    )
  }

  const passedQuizzes = new Set(attempts.filter((a) => a.passed).map((a) => a.quiz_id))
  const totalItems = lessons.length + course.quizzes.length
  const doneItems = lessons.filter((l) => done.has(l.id)).length + course.quizzes.filter((q) => passedQuizzes.has(q.id)).length
  const percent = totalItems ? Math.round((doneItems / totalItems) * 100) : 0
  const complete = lessons.length > 0 && doneItems === totalItems

  const lesson = lessons.find((l) => l.id === selectedLessonId)
  const lessonIndex = lessons.indexOf(lesson)
  const quiz = course.quizzes.find((q) => q.id === selectedQuizId)

  const toggleDone = async (lessonId) => {
    const isDone = done.has(lessonId)
    const nextDone = new Set(done)
    if (isDone) nextDone.delete(lessonId)
    else nextDone.add(lessonId)
    setData({ ...data, done: nextDone })
    const { error } = isDone
      ? await supabase.from('lesson_progress').delete().eq('lesson_id', lessonId).eq('student_id', user.id)
      : await supabase.from('lesson_progress').insert({ lesson_id: lessonId, student_id: user.id, course_id: course.id })
    if (error) {
      toast.error(errorMessage(error))
      reload()
    }
  }

  const completeAndNext = async () => {
    if (!done.has(lesson.id) && enrolled) await toggleDone(lesson.id)
    const next = lessons[lessonIndex + 1]
    if (next) setParams({ lesson: next.id })
    else if (course.quizzes.some((q) => !passedQuizzes.has(q.id))) setParams({ quiz: course.quizzes.find((q) => !passedQuizzes.has(q.id)).id })
    else setParams({ view: 'certificate' })
  }

  const claim = async () => {
    const { data: cert, error } = await supabase.rpc('claim_certificate', { p_course_id: course.id })
    if (error) return toast.error(errorMessage(error))
    toast.success('Congratulations! Your certificate is ready.')
    navigate(`/certificate/${cert.code}`)
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your progress</p>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar value={percent} />
          <span className="text-sm font-bold text-slate-800">{percent}%</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
          {[
            ['lesson', 'Lessons', PlayCircle],
            ['assignments', 'Tasks', ClipboardList],
            ['announcements', 'News', Bell],
          ].map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => (v === 'lesson' ? setParams({ lesson: lesson?.id || lessons[0]?.id || '' }) : setParams({ view: v }))}
              className={cn('flex items-center justify-center gap-1 rounded-md py-1.5', (view === v || (v === 'lesson' && view === 'quiz')) ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900')}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {course.modules.map((m, mi) => {
          const moduleQuizzes = course.quizzes.filter((q) => q.module_id === m.id)
          return (
            <div key={m.id} className="border-b border-slate-100">
              <button onClick={() => setCollapsed((c) => ({ ...c, [m.id]: !c[m.id] }))} className="flex w-full items-center justify-between gap-3 bg-slate-50 px-5 py-3 text-left">
                <span>
                  <span className="block text-[11px] font-semibold uppercase text-slate-400">Section {mi + 1}</span>
                  <span className="block text-sm font-semibold text-slate-800">{m.title}</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !collapsed[m.id] && 'rotate-180')} />
              </button>
              {!collapsed[m.id] && (
                <ul>
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <div className={cn('flex items-start gap-3 px-5 py-3 text-sm', l.id === selectedLessonId && view === 'lesson' ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                        <button onClick={() => enrolled && toggleDone(l.id)} className="mt-0.5 shrink-0" aria-label="Toggle complete" disabled={!enrolled}>
                          {done.has(l.id) ? <CircleCheck className="h-[18px] w-[18px] text-emerald-600" /> : <Circle className="h-[18px] w-[18px] text-slate-300" />}
                        </button>
                        <button onClick={() => setParams({ lesson: l.id })} className="flex-1 text-left">
                          <span className={cn('block', l.id === selectedLessonId && view === 'lesson' ? 'font-semibold text-brand-800' : 'text-slate-700')}>{l.title}</span>
                          {l.duration_minutes > 0 && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                              <PlayCircle className="h-3 w-3" /> {formatMinutes(l.duration_minutes)}
                            </span>
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                  {moduleQuizzes.map((q) => (
                    <QuizNavItem key={q.id} quiz={q} passed={passedQuizzes.has(q.id)} active={q.id === selectedQuizId} onClick={() => setParams({ quiz: q.id })} />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
        {course.quizzes.filter((q) => !q.module_id || !course.modules.some((m) => m.id === q.module_id)).length > 0 && (
          <div className="border-b border-slate-100">
            <p className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800">Final assessment</p>
            <ul>
              {course.quizzes
                .filter((q) => !q.module_id || !course.modules.some((m) => m.id === q.module_id))
                .map((q) => (
                  <QuizNavItem key={q.id} quiz={q} passed={passedQuizzes.has(q.id)} active={q.id === selectedQuizId} onClick={() => setParams({ quiz: q.id })} />
                ))}
            </ul>
          </div>
        )}
        <button onClick={() => setParams({ view: 'certificate' })} className={cn('flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold', view === 'certificate' ? 'bg-amber-50 text-amber-800' : 'text-slate-700 hover:bg-slate-50')}>
          <Award className={cn('h-5 w-5', complete ? 'text-amber-500' : 'text-slate-300')} /> Certificate
        </button>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/student/courses" className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">My courses</span>
          </Link>
          <span className="hidden h-5 w-px bg-slate-700 sm:block" />
          <p className="truncate text-sm font-semibold">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {!enrolled && <Badge tone="amber">Preview mode</Badge>}
          {certificate ? (
            <Button to={`/certificate/${certificate.code}`} size="sm" variant="accent">
              <Trophy className="h-4 w-4" /> <span className="hidden sm:inline">Certificate</span>
            </Button>
          ) : (
            <span className="hidden text-xs text-slate-400 sm:block">{percent}% complete</span>
          )}
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Course content">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
            {view === 'lesson' && lesson && (
              <LessonView lesson={lesson} isDone={done.has(lesson.id)} enrolled={enrolled} onToggle={() => toggleDone(lesson.id)} onNext={completeAndNext} onPrev={lessonIndex > 0 ? () => setParams({ lesson: lessons[lessonIndex - 1].id }) : null} hasNext={lessonIndex < lessons.length - 1} />
            )}
            {view === 'lesson' && !lesson && <EmptyState icon={PlayCircle} title="No lessons yet" description="The teacher is still building this course." />}
            {view === 'quiz' && quiz && <QuizView key={quiz.id} quiz={quiz} enrolled={enrolled} attempts={attempts.filter((a) => a.quiz_id === quiz.id)} onSubmitted={reload} />}
            {view === 'assignments' && <AssignmentsView courseId={course.id} enrolled={enrolled} />}
            {view === 'announcements' && <CourseAnnouncements courseId={course.id} />}
            {view === 'certificate' && (
              <Card className="p-8 text-center sm:p-12">
                <div className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full', complete ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400')}>
                  <Award className="h-10 w-10" />
                </div>
                <h2 className="mt-6 text-2xl font-bold">{certificate ? 'You earned your certificate!' : complete ? 'Course complete. Congratulations!' : 'Keep going!'}</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-600">
                  {complete
                    ? 'You have completed every lesson and passed every quiz. Claim your verified certificate of completion.'
                    : `Complete all ${lessons.length} lessons${course.quizzes.length ? ` and pass all ${course.quizzes.length} quizzes` : ''} to unlock your certificate. You're ${percent}% of the way there.`}
                </p>
                <div className="mx-auto mt-6 max-w-xs">
                  <ProgressBar value={percent} />
                </div>
                {certificate ? (
                  <Button to={`/certificate/${certificate.code}`} className="mt-8" size="lg">View certificate</Button>
                ) : (
                  complete && enrolled && <Button onClick={claim} className="mt-8" size="lg" variant="accent"><Trophy className="h-5 w-5" /> Claim certificate</Button>
                )}
              </Card>
            )}
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 border-l border-slate-200 lg:block">{sidebar}</aside>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
                <Logo />
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">{sidebar}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuizNavItem({ quiz, passed, active, onClick }) {
  return (
    <li>
      <button onClick={onClick} className={cn('flex w-full items-center gap-3 px-5 py-3 text-left text-sm', active ? 'bg-brand-50' : 'hover:bg-slate-50')}>
        {passed ? <CircleCheck className="h-[18px] w-[18px] shrink-0 text-emerald-600" /> : <ListChecks className="h-[18px] w-[18px] shrink-0 text-violet-500" />}
        <span className={cn(active ? 'font-semibold text-brand-800' : 'text-slate-700')}>
          {quiz.title}
          <span className="block text-xs text-slate-400">Quiz · pass {quiz.pass_percent}%</span>
        </span>
      </button>
    </li>
  )
}

function LessonView({ lesson, isDone, enrolled, onToggle, onNext, onPrev, hasNext }) {
  return (
    <div className="space-y-6">
      {lesson.video_url && <VideoEmbed url={lesson.video_url} title={lesson.title} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          {lesson.duration_minutes > 0 && <p className="mt-1 text-sm text-slate-500">{formatMinutes(lesson.duration_minutes)}</p>}
        </div>
        {enrolled && (
          <Button variant={isDone ? 'soft' : 'secondary'} size="sm" onClick={onToggle}>
            {isDone ? <><CircleCheck className="h-4 w-4" /> Completed</> : <><Circle className="h-4 w-4" /> Mark as complete</>}
          </Button>
        )}
      </div>
      {lesson.content && (
        <Card className="p-6 sm:p-8">
          <Markdown>{lesson.content}</Markdown>
        </Card>
      )}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        {onPrev ? (
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext}>
          {enrolled && !isDone ? 'Complete & continue' : hasNext ? 'Next lesson' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function QuizView({ quiz, enrolled, attempts, onSubmitted }) {
  const { data: questions, loading } = useQuery(
    async () => unwrap(await supabase.from('quiz_questions').select('id, question, options, position').eq('quiz_id', quiz.id).order('position').order('id')),
    [quiz.id],
  )
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const best = attempts.reduce((b, a) => Math.max(b, a.percent), 0)
  const passed = attempts.some((a) => a.passed)

  if (loading) return <PageLoader />

  const submit = async () => {
    if (questions.some((q) => answers[q.id] == null)) return toast.error('Please answer every question')
    setBusy(true)
    const { data, error } = await supabase.rpc('submit_quiz', { p_quiz_id: quiz.id, p_answers: questions.map((q) => answers[q.id]) })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    setResult(data)
    onSubmitted()
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="violet"><ListChecks className="h-3.5 w-3.5" /> Quiz</Badge>
        <h1 className="mt-3 text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-slate-600">{quiz.description}</p>}
        <p className="mt-2 text-sm text-slate-500">
          {questions.length} questions · Pass mark {quiz.pass_percent}%{attempts.length > 0 && ` · Best score ${best}%`}
        </p>
      </div>

      {result ? (
        <Card className="p-8 text-center">
          <div className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full font-display text-2xl font-bold', result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
            {result.percent}%
          </div>
          <h2 className="mt-5 text-xl font-bold">{result.passed ? 'You passed!' : 'Not quite there yet'}</h2>
          <p className="mt-1 text-slate-600">
            You answered {result.score} of {result.total} questions correctly.
            {!result.passed && ` You need ${quiz.pass_percent}% to pass. Review the lessons and try again.`}
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => { setResult(null); setAnswers({}) }}>
            <RotateCcw className="h-4 w-4" /> Retake quiz
          </Button>
        </Card>
      ) : questions.length === 0 ? (
        <EmptyState icon={ListChecks} title="No questions yet" />
      ) : (
        <>
          {passed && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">You've already passed this quiz. You can retake it anytime to practice.</div>}
          {questions.map((q, qi) => (
            <Card key={q.id} className="p-6">
              <p className="font-semibold text-slate-900">
                <span className="mr-2 text-slate-400">{qi + 1}.</span>
                {q.question}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition', answers[q.id] === oi ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-slate-200 hover:border-slate-300')}>
                    <input type="radio" name={q.id} className="h-4 w-4 text-brand-600" checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                    {opt}
                  </label>
                ))}
              </div>
            </Card>
          ))}
          {enrolled ? (
            <Button size="lg" onClick={submit} loading={busy}>Submit answers</Button>
          ) : (
            <p className="text-sm text-slate-500">Preview mode: students submit answers here.</p>
          )}
        </>
      )}
    </div>
  )
}

function AssignmentsView({ courseId, enrolled }) {
  const { user } = useAuth()
  const { data, loading, reload } = useQuery(async () => {
    const [assignments, submissions] = await Promise.all([
      supabase.from('assignments').select('*').eq('course_id', courseId).order('created_at'),
      supabase.from('submissions').select('*').eq('course_id', courseId).eq('student_id', user.id),
    ])
    return { assignments: unwrap(assignments), submissions: Object.fromEntries((unwrap(submissions) || []).map((s) => [s.assignment_id, s])) }
  }, [courseId])

  if (loading) return <PageLoader />
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Practical tasks reviewed and graded by your teacher.</p>
      </div>
      {data.assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments" description="This course doesn't have any assignments yet." />
      ) : (
        data.assignments.map((a) => <AssignmentCard key={a.id} assignment={a} submission={data.submissions[a.id]} enrolled={enrolled} onSaved={reload} />)
      )}
    </div>
  )
}

function AssignmentCard({ assignment, submission, enrolled, onSaved }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(!submission)
  const [form, setForm] = useState({ content: submission?.content || '', link_url: submission?.link_url || '' })
  const [busy, setBusy] = useState(false)
  const overdue = assignment.due_date && new Date(assignment.due_date) < new Date()

  const save = async (e) => {
    e.preventDefault()
    if (!form.content.trim() && !form.link_url.trim()) return toast.error('Add a response or a link')
    setBusy(true)
    const payload = { ...form, assignment_id: assignment.id, course_id: assignment.course_id, student_id: user.id }
    const { error } = submission ? await supabase.from('submissions').update(form).eq('id', submission.id) : await supabase.from('submissions').insert(payload)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success('Submission saved')
    setEditing(false)
    onSaved()
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-6">
        <div>
          <h3 className="text-lg font-semibold">{assignment.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {assignment.max_points} points
            {assignment.due_date && <> · Due {formatDateTime(assignment.due_date)} {overdue && <span className="font-semibold text-red-600">(past due)</span>}</>}
          </p>
        </div>
        {submission && <StatusBadge status={submission.status} />}
      </div>
      <div className="space-y-5 p-6">
        {assignment.instructions && <Markdown className="prose-sm">{assignment.instructions}</Markdown>}
        {submission?.status === 'returned' && (
          <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="text-sm font-semibold text-amber-900">Your teacher asked for changes</p>
            {submission.feedback && <p className="mt-2 whitespace-pre-line text-sm text-amber-900/80">{submission.feedback}</p>}
          </div>
        )}
        {submission?.status === 'graded' && (
          <div className="rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-900">
              Grade: {submission.grade}/{assignment.max_points}
            </p>
            {submission.feedback && <p className="mt-2 whitespace-pre-line text-sm text-emerald-900/80">{submission.feedback}</p>}
          </div>
        )}
        {submission && !editing && (
          <div className="rounded-xl bg-slate-50 p-5 text-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Your submission · {timeAgo(submission.submitted_at)}</p>
            {submission.content && <p className="mt-2 whitespace-pre-line text-slate-700">{submission.content}</p>}
            {submission.link_url && <a href={submission.link_url} target="_blank" rel="noreferrer" className="mt-2 block break-all font-medium text-brand-600 hover:underline">{submission.link_url}</a>}
            {submission.status !== 'graded' && enrolled && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing(true)}>Edit submission</Button>
            )}
          </div>
        )}
        {editing && enrolled && (
          <form onSubmit={save} className="space-y-4">
            <Textarea label="Your response" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <Input label="Link to your work (Google Drive, Canva, Behance, etc.)" type="url" placeholder="https://" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>{submission ? 'Update submission' : 'Submit assignment'}</Button>
              {submission && <Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </form>
        )}
      </div>
    </Card>
  )
}

function CourseAnnouncements({ courseId }) {
  const { data, loading } = useQuery(
    async () => unwrap(await supabase.from('announcements').select('*, author:profiles!announcements_author_id_fkey(full_name)').eq('course_id', courseId).order('created_at', { ascending: false })),
    [courseId],
  )
  if (loading) return <PageLoader />
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Course announcements</h1>
      {data.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements" description="Your teacher hasn't posted any updates yet." />
      ) : (
        data.map((a) => (
          <Card key={a.id} className="p-6">
            <p className="text-xs text-slate-500">{a.author?.full_name} · {formatDate(a.created_at)}</p>
            <h3 className="mt-1 text-lg font-semibold">{a.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{a.body}</p>
          </Card>
        ))
      )}
    </div>
  )
}
