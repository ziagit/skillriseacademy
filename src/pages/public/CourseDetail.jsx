import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Award, BarChart3, BookOpen, Check, ChevronDown, CirclePlay, ClipboardList, Clock, Globe, ListChecks, Lock, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, formatDate, formatMinutes, levelLabel } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CourseThumbnail, Markdown, VideoEmbed, categoryColor } from '../../components/shared'
import { Avatar, Badge, Button, Modal, PageLoader } from '../../components/ui'
import NotFound from './NotFound'

export default function CourseDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [enrolling, setEnrolling] = useState(false)
  const [preview, setPreview] = useState(null)
  const [openModules, setOpenModules] = useState({ 0: true })

  const { data, loading } = useQuery(async () => {
    const course = unwrap(
      await supabase
        .from('courses')
        .select('*, category:categories(name, slug, icon, color), teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, headline, bio), modules(id, title, position, lessons(id, title, duration_minutes, is_preview, video_url, position)), quizzes(id), assignments(id)')
        .eq('slug', slug)
        .maybeSingle(),
    )
    if (!course) return null
    course.modules.sort((a, b) => a.position - b.position).forEach((m) => m.lessons.sort((a, b) => a.position - b.position))
    const [{ data: counts }, enrollment] = await Promise.all([
      supabase.rpc('course_enrollment_counts'),
      user ? supabase.from('enrollments').select('id').eq('course_id', course.id).eq('student_id', user.id).maybeSingle() : { data: null },
    ])
    return {
      course,
      students: counts?.find((c) => c.course_id === course.id)?.students || 0,
      enrolled: !!enrollment.data,
    }
  }, [slug, user?.id])

  if (loading) return <PageLoader />
  if (!data) return <NotFound />

  const { course, students, enrolled } = data
  const lessons = course.modules.flatMap((m) => m.lessons)
  const minutes = lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0)
  const isPublished = course.status === 'published'

  const enroll = async () => {
    if (!user) return navigate('/login', { state: { from: `/courses/${slug}` } })
    if (enrolled) return navigate(`/learn/${slug}`)
    setEnrolling(true)
    const { error } = await supabase.from('enrollments').insert({ course_id: course.id, student_id: user.id })
    setEnrolling(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('courseDetail.enrolled'))
    navigate(`/learn/${slug}`)
  }

  const facts = [
    { icon: BookOpen, label: t('course.lessonCount', { count: lessons.length }) },
    minutes > 0 && { icon: Clock, label: t('courseDetail.ofContent', { duration: formatMinutes(minutes) }) },
    { icon: BarChart3, label: levelLabel(course.level) },
    { icon: Globe, label: course.language },
    course.quizzes.length > 0 && { icon: ListChecks, label: t('course.quizCount', { count: course.quizzes.length }) },
    course.assignments.length > 0 && { icon: ClipboardList, label: t('course.assignmentCount', { count: course.assignments.length }) },
    { icon: Award, label: t('courseDetail.certificate') },
  ].filter(Boolean)

  return (
    <>
      <section className="bg-slate-950 text-white">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-3 lg:py-16">
          <div className="lg:col-span-2">
            {!isPublished && (
              <Badge tone="amber" className="mb-4">
                {t('courseDetail.previewStatus', { status: t(`status.${course.status}`) })}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/courses" className="text-slate-400 hover:text-white">{t('nav.courses')}</Link>
              {course.category && (
                <>
                  <span className="text-slate-600">/</span>
                  <Link to={`/courses?category=${course.category.slug}`} className="font-medium text-brand-300 hover:text-brand-200">{course.category.name}</Link>
                </>
              )}
            </div>
            <h1 dir="auto" className="mt-4 text-3xl font-bold text-white sm:text-4xl">{course.title}</h1>
            {course.subtitle && <p dir="auto" className="mt-4 text-lg text-slate-300">{course.subtitle}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Avatar src={course.teacher?.avatar_url} name={course.teacher?.full_name} size="sm" className="ring-slate-800" />
                {t('courseDetail.taughtBy')} <span className="font-semibold text-white">{course.teacher?.full_name}</span>
              </span>
              {students > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {t('courseDetail.learners', { count: students })}
                </span>
              )}
              {course.updated_at && <span>{t('courseDetail.updated', { date: formatDate(course.updated_at, { month: 'long', year: 'numeric' }) })}</span>}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {course.outcomes?.filter(Boolean).length > 0 && (
            <section className="rounded-2xl border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold">{t('courseDetail.outcomes')}</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.filter(Boolean).map((o) => (
                  <li key={o} className="flex gap-3 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span dir="auto">{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold">{t('courseDetail.content')}</h2>
              <p className="text-sm text-slate-500">
                {t('courseDetail.sectionCount', { count: course.modules.length })} · {t('course.lessonCount', { count: lessons.length })}{minutes > 0 && ` · ${formatMinutes(minutes)}`}
              </p>
            </div>
            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
              {course.modules.length === 0 && <p className="p-5 text-sm text-slate-500">{t('courseDetail.preparing')}</p>}
              {course.modules.map((m, i) => (
                <div key={m.id}>
                  <button onClick={() => setOpenModules((s) => ({ ...s, [i]: !s[i] }))} className="flex w-full items-center justify-between gap-4 bg-slate-50 px-5 py-4 text-start">
                    <span className="flex items-center gap-3 font-semibold text-slate-900">
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition', openModules[i] && 'rotate-180')} />
                      {m.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{t('course.lessonCount', { count: m.lessons.length })}</span>
                  </button>
                  {openModules[i] && (
                    <ul className="divide-y divide-slate-100 bg-white">
                      {m.lessons.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                          <span className="flex items-center gap-3 text-slate-700">
                            {l.is_preview ? <CirclePlay className="h-4 w-4 text-brand-600" /> : <Lock className="h-4 w-4 text-slate-300" />}
                            {l.is_preview && l.video_url ? (
                              <button onClick={() => setPreview(l)} className="text-start font-medium text-brand-700 hover:underline">{l.title}</button>
                            ) : (
                              l.title
                            )}
                            {l.is_preview && <Badge tone="blue">{t('courseDetail.preview')}</Badge>}
                          </span>
                          {l.duration_minutes > 0 && <span className="shrink-0 text-xs text-slate-500">{formatMinutes(l.duration_minutes)}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {course.description && (
            <section>
              <h2 className="text-xl font-bold">{t('courseDetail.about')}</h2>
              <Markdown className="mt-4">{course.description}</Markdown>
            </section>
          )}

          {course.requirements?.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xl font-bold">{t('courseDetail.requirements')}</h2>
              <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-slate-700">
                {course.requirements.filter(Boolean).map((r) => (
                  <li key={r} dir="auto">{r}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold">{t('courseDetail.teacher')}</h2>
            <div className="mt-5 flex items-start gap-4">
              <Avatar src={course.teacher?.avatar_url} name={course.teacher?.full_name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{course.teacher?.full_name}</p>
                {course.teacher?.headline && <p className="text-sm text-brand-700">{course.teacher.headline}</p>}
                {course.teacher?.bio && <p dir="auto" className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{course.teacher.bio}</p>}
              </div>
            </div>
          </section>
        </div>

        {/* Enrollment card */}
        <aside>
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <CourseThumbnail course={course} />
            <div className="p-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-slate-900">{t('common.free')}</span>
                <span className="text-sm text-slate-500">{t('courseDetail.funded')}</span>
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={enroll} loading={enrolling} disabled={!isPublished && !enrolled}>
                {enrolled ? t('courseDetail.continue') : t('courseDetail.enroll')}
              </Button>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-center gap-3">
                    <f.icon className={cn('h-4 w-4', categoryColor(course.category?.color).text)} /> {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title} size="xl">
        {preview && <VideoEmbed url={preview.video_url} title={preview.title} />}
      </Modal>
    </>
  )
}
