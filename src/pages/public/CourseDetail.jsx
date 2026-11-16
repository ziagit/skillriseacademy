import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Award, BarChart3, BookOpen, Check, ChevronDown, ChevronRight, CirclePlay, Clock, Globe, ListChecks, Lock, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, formatMinutes, levelLabel } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CategoryIcon, CourseThumbnail, Markdown, VideoEmbed, categoryColor } from '../../components/shared'
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


  const outcomes = course.outcomes?.filter(Boolean) || []
  const requirements = course.requirements?.filter(Boolean) || []
  const sections = [
    { id: 'about', label: t('courseDetail.tabs.about') },
    outcomes.length > 0 && { id: 'outcomes', label: t('courseDetail.tabs.outcomes') },
    { id: 'modules', label: t('courseDetail.tabs.modules') },
    { id: 'instructor', label: t('courseDetail.tabs.instructor') },
  ].filter(Boolean)
  const color = categoryColor(course.category?.color)
  const allOpen = course.modules.length > 0 && course.modules.every((_, i) => openModules[i])

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-brand-50/70">
        <div className="absolute -end-24 -top-24 hidden h-96 w-96 rounded-full bg-brand-100 lg:block" />
        <div className="container-page relative grid gap-10 pb-24 pt-8 lg:grid-cols-[1fr_380px] lg:pb-28">
          <div>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Link to="/" className="hover:text-brand-700 hover:underline">{t('courseDetail.home')}</Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 rtl:-scale-x-100" />
              <Link to="/courses" className="hover:text-brand-700 hover:underline">{t('nav.courses')}</Link>
              {course.category && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 rtl:-scale-x-100" />
                  <Link to={`/courses?category=${course.category.slug}`} className="hover:text-brand-700 hover:underline">{course.category.name}</Link>
                </>
              )}
            </nav>
            {!isPublished && (
              <Badge tone="amber" className="mt-5">
                {t('courseDetail.previewStatus', { status: t(`status.${course.status}`) })}
              </Badge>
            )}
            {course.category && (
              <div className="mt-6 flex items-center gap-2.5">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br text-white', color.grad)}>
                  <CategoryIcon name={course.category.icon} className="h-4.5 w-4.5" />
                </span>
                <span className="font-semibold text-slate-700">{course.category.name}</span>
              </div>
            )}
            <h1 dir="auto" className="mt-4 text-3xl font-bold leading-tight sm:text-[42px]">{course.title}</h1>
            {course.subtitle && <p dir="auto" className="mt-3 max-w-2xl text-lg text-slate-700">{course.subtitle}</p>}
            <p className="mt-5 flex items-center gap-2 text-slate-700">
              <Avatar src={course.teacher?.avatar_url} name={course.teacher?.full_name} size="sm" />
              {t('courseDetail.instructor')}{' '}
              <a href="#instructor" className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2 hover:text-brand-700">{course.teacher?.full_name}</a>
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button size="xl" onClick={enroll} loading={enrolling} disabled={!isPublished && !enrolled} className="min-w-56 flex-col gap-0 py-2 leading-tight">
                <span>{enrolled ? t('courseDetail.continue') : t('courseDetail.enroll')}</span>
                {!enrolled && <span className="text-xs font-normal opacity-90">{t('courseDetail.startToday')}</span>}
              </Button>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{t('common.free')}</span> {t('courseDetail.funded')}
              </p>
            </div>
            {students > 0 && (
              <p className="mt-4 text-sm text-slate-700">
                <span className="font-semibold">{t('courseDetail.alreadyEnrolled', { count: students })}</span>
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-xl bg-white p-2 shadow-xl">
              <div className="overflow-hidden rounded-lg">
                <CourseThumbnail course={course} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coursera-style overlapping summary strip */}
      <div className="container-page relative -mt-16">
        <div className="grid divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-lift sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
          <Fact title={t('courseDetail.moduleCount', { count: course.modules.length })} text={t('courseDetail.modulesHint', { count: lessons.length })} />
          <Fact title={levelLabel(course.level)} text={t('courseDetail.levelHint')} icon={BarChart3} />
          <Fact title={minutes > 0 ? t('courseDetail.hoursToComplete', { duration: formatMinutes(minutes) }) : t('course.lessonCount', { count: lessons.length })} text={t('courseDetail.flexible')} icon={Clock} />
          <Fact title={t('courseDetail.certificate')} text={t('courseDetail.shareable')} icon={Award} />
        </div>
      </div>

      {/* Section tabs */}
      <div className="sticky top-16 z-30 mt-8 border-b border-slate-200 bg-white md:top-[100px]">
        <nav className="container-page no-scrollbar flex gap-6 overflow-x-auto">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap border-b-2 border-transparent py-3.5 text-sm font-semibold text-slate-600 transition hover:border-brand-600 hover:text-brand-700">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-page grid gap-12 py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-12">
          <section id="about" className="scroll-mt-40">
            {course.description ? (
              <>
                <h2 className="text-2xl font-semibold">{t('courseDetail.about')}</h2>
                <Markdown className="mt-4">{course.description}</Markdown>
              </>
            ) : (
              <h2 className="text-2xl font-semibold">{t('courseDetail.detailsToKnow')}</h2>
            )}
            <div className="mt-8">
              {course.description && <h3 className="text-lg font-semibold">{t('courseDetail.detailsToKnow')}</h3>}
              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                <Detail icon={Award} title={t('courseDetail.shareableCert')} text={t('courseDetail.shareableCertHint')} />
                <Detail
                  icon={ListChecks}
                  title={t('courseDetail.assessments')}
                  text={[course.quizzes.length > 0 && t('course.quizCount', { count: course.quizzes.length }), course.assignments.length > 0 && t('course.assignmentCount', { count: course.assignments.length })].filter(Boolean).join(' · ') || t('courseDetail.noAssessments')}
                />
                <Detail icon={Globe} title={t('courseDetail.taughtIn')} text={course.language} />
              </div>
            </div>
            {requirements.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold">{t('courseDetail.requirements')}</h3>
                <ul className="mt-3 list-disc space-y-1.5 ps-5 text-slate-700">
                  {requirements.map((r) => (
                    <li key={r} dir="auto">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {outcomes.length > 0 && (
            <section id="outcomes" className="scroll-mt-40 rounded-xl border border-slate-200 p-6 sm:p-8">
              <h2 className="text-2xl font-semibold">{t('courseDetail.outcomes')}</h2>
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {outcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-slate-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" /> <span dir="auto">{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="modules" className="scroll-mt-40">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{t('courseDetail.thereAre', { count: course.modules.length })}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t('course.lessonCount', { count: lessons.length })}{minutes > 0 && ` · ${formatMinutes(minutes)}`}
                </p>
              </div>
              {course.modules.length > 1 && (
                <button
                  onClick={() => setOpenModules(allOpen ? {} : Object.fromEntries(course.modules.map((_, i) => [i, true])))}
                  className="link text-sm"
                >
                  {allOpen ? t('courseDetail.collapseAll') : t('courseDetail.expandAll')}
                </button>
              )}
            </div>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {course.modules.length === 0 && <p className="py-5 text-sm text-slate-500">{t('courseDetail.preparing')}</p>}
              {course.modules.map((m, i) => {
                const moduleMinutes = m.lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0)
                return (
                  <div key={m.id}>
                    <button onClick={() => setOpenModules((s) => ({ ...s, [i]: !s[i] }))} className="flex w-full items-center justify-between gap-4 py-5 text-start" aria-expanded={!!openModules[i]}>
                      <span>
                        <span dir="auto" className="block text-lg font-semibold text-slate-900">{m.title}</span>
                        <span className="mt-0.5 block text-sm text-slate-600">
                          {t('courseDetail.moduleLabel', { n: i + 1 })} · {t('course.lessonCount', { count: m.lessons.length })}{moduleMinutes > 0 && ` · ${formatMinutes(moduleMinutes)}`}
                        </span>
                      </span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-600 transition', openModules[i] && 'rotate-180')} />
                    </button>
                    {openModules[i] && (
                      <ul className="mb-5 space-y-1 rounded-lg bg-slate-50 p-2">
                        {m.lessons.map((l) => (
                          <li key={l.id} className="flex items-center justify-between gap-4 rounded-md px-3 py-2.5 text-sm">
                            <span className="flex items-center gap-3 text-slate-700">
                              {l.is_preview ? <CirclePlay className="h-4 w-4 shrink-0 text-brand-600" /> : <Lock className="h-4 w-4 shrink-0 text-slate-400" />}
                              {l.is_preview && l.video_url ? (
                                <button onClick={() => setPreview(l)} dir="auto" className="text-start font-semibold text-brand-700 hover:underline">{l.title}</button>
                              ) : (
                                <span dir="auto">{l.title}</span>
                              )}
                              {l.is_preview && <Badge tone="blue">{t('courseDetail.preview')}</Badge>}
                            </span>
                            {l.duration_minutes > 0 && <span className="shrink-0 text-xs text-slate-500">{formatMinutes(l.duration_minutes)}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section id="instructor" className="scroll-mt-40">
            <h2 className="text-2xl font-semibold">{t('courseDetail.teacher')}</h2>
            <div className="mt-5 flex items-start gap-4">
              <Avatar src={course.teacher?.avatar_url} name={course.teacher?.full_name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-brand-700">{course.teacher?.full_name}</p>
                {course.teacher?.headline && <p className="text-sm text-slate-600">{course.teacher.headline}</p>}
                {students > 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="h-4 w-4" /> {t('courseDetail.learners', { count: students })}
                  </p>
                )}
                {course.teacher?.bio && <p dir="auto" className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{course.teacher.bio}</p>}
              </div>
            </div>
          </section>
        </div>

        {/* Certificate promo, like Coursera's "Earn a career certificate" box */}
        <aside>
          <div className="sticky top-40 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">{t('courseDetail.earnCert')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('courseDetail.earnCertText')}</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {[t('courseDetail.perk1'), t('courseDetail.perk2'), t('courseDetail.perk3')].map((p) => (
                <li key={p} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {p}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" onClick={enroll} loading={enrolling} disabled={!isPublished && !enrolled}>
              {enrolled ? t('courseDetail.continue') : t('courseDetail.enroll')}
            </Button>
          </div>
        </aside>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title} size="xl">
        {preview && <VideoEmbed url={preview.video_url} title={preview.title} />}
      </Modal>
    </>
  )
}

function Fact({ title, text, icon: Icon = BookOpen }) {
  return (
    <div className="flex gap-3 p-5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, title, text }) {
  return (
    <div>
      <Icon className="h-6 w-6 text-slate-700" />
      <p className="mt-2 text-sm text-slate-600">{title}</p>
      <p className="font-semibold text-slate-900">{text}</p>
    </div>
  )
}
