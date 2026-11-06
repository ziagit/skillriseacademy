import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, GraduationCap, PenLine, Plus, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { timeAgo } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CourseThumbnail } from '../../components/shared'
import { Avatar, Button, Card, CardHeader, EmptyState, PageHeader, PageLoader, StatCard, StatusBadge } from '../../components/ui'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { data, loading } = useQuery(async () => {
    const courses = unwrap(await supabase.from('courses').select('id, title, slug, status, thumbnail_url, updated_at, category:categories(icon, color), enrollments(count)').eq('teacher_id', user.id).order('updated_at', { ascending: false }))
    const ids = courses.map((c) => c.id)
    const [subs, pendingCount, completions] = await Promise.all([
      ids.length
        ? supabase.from('submissions').select('id, submitted_at, status, assignment:assignments(title), course:courses(title), student:profiles!submissions_student_id_fkey(full_name, avatar_url)').in('course_id', ids).eq('status', 'submitted').order('submitted_at', { ascending: false }).limit(6)
        : { data: [] },
      ids.length ? supabase.from('submissions').select('id', { count: 'exact', head: true }).in('course_id', ids).eq('status', 'submitted') : { count: 0 },
      ids.length ? supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', ids).not('completed_at', 'is', null) : { count: 0 },
    ])
    return {
      courses,
      students: courses.reduce((s, c) => s + (c.enrollments?.[0]?.count || 0), 0),
      pending: unwrap(subs) || [],
      pendingCount: pendingCount.count || 0,
      completions: completions.count || 0,
    }
  }, [user.id])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('portalNav.teacherOverview')}
        description={t('teacher.dash.description')}
        actions={
          <>
            <Button to="/teacher/blog/new" variant="secondary"><PenLine className="h-4 w-4" /> {t('teacher.dash.writePost')}</Button>
            <Button to="/teacher/courses?new=1"><Plus className="h-4 w-4" /> {t('teacher.newCourse')}</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('portalNav.myCourses')} value={t('common.number', { n: data.courses.length })} icon={BookOpen} to="/teacher/courses" />
        <StatCard label={t('teacher.dash.learners')} value={t('common.number', { n: data.students })} icon={Users} tone="violet" />
        <StatCard label={t('teacher.dash.completions')} value={t('common.number', { n: data.completions })} icon={GraduationCap} tone="green" />
        <StatCard label={t('teacher.dash.awaiting')} value={t('common.number', { n: data.pendingCount })} icon={ClipboardList} tone="amber" to="/teacher/submissions" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title={t('portalNav.myCourses')} action={<Link to="/teacher/courses" className="text-sm font-semibold text-brand-600 hover:underline">{t('teacher.dash.manage')}</Link>} />
          {data.courses.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={BookOpen} title={t('teacher.dash.createFirst')} description={t('teacher.dash.createFirstHint')} action={<Button to="/teacher/courses?new=1">{t('teacher.newCourse')}</Button>} />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.courses.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link to={`/teacher/courses/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                    <CourseThumbnail course={c} className="!w-20 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">{t('courseDetail.learners', { count: c.enrollments?.[0]?.count || 0 })} · {t('teacher.updated', { time: timeAgo(c.updated_at) })}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={t('teacher.dash.needsGrading')} action={<Link to="/teacher/submissions" className="text-sm font-semibold text-brand-600 hover:underline">{t('common.all')}</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.pending.map((s) => (
              <li key={s.id}>
                <Link to="/teacher/submissions" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                  <Avatar src={s.student?.avatar_url} name={s.student?.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{s.student?.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{s.assignment?.title} · {s.course?.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(s.submitted_at)}</span>
                </Link>
              </li>
            ))}
            {data.pending.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">{t('teacher.dash.nothingToGrade')}</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
