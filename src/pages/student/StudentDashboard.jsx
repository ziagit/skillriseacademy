import { Link } from 'react-router-dom'
import { ArrowRight, Award, Bell, BookOpen, CircleCheck, Compass, PlayCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { fetchMyEnrollments } from '../../lib/queries'
import { unwrap, useQuery } from '../../lib/useQuery'
import { timeAgo } from '../../lib/utils'
import { COURSE_CARD_SELECT, CourseCard, CourseThumbnail } from '../../components/shared'
import { Button, Card, CardHeader, EmptyState, PageLoader, ProgressBar, StatCard } from '../../components/ui'

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const { data, loading } = useQuery(async () => {
    const [enrollments, certificates, announcements, courses] = await Promise.all([
      fetchMyEnrollments(user.id),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
      supabase.from('announcements').select('id, title, body, created_at, course:courses(title)').order('created_at', { ascending: false }).limit(4),
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').order('featured', { ascending: false }).limit(6),
    ])
    const enrolledIds = new Set(enrollments.map((e) => e.course.id))
    return {
      enrollments,
      certificates: certificates.count || 0,
      announcements: unwrap(announcements) || [],
      recommended: (unwrap(courses) || []).filter((c) => !enrolledIds.has(c.id)).slice(0, 3),
    }
  }, [user.id])

  if (loading) return <PageLoader />
  const inProgress = data.enrollments.filter((e) => !e.completed_at).sort((a, b) => (b.lastActivity > a.lastActivity ? 1 : -1))
  const completed = data.enrollments.filter((e) => e.completed_at).length
  const current = inProgress[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hi {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Pick up where you left off and keep building your skills.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Courses in progress" value={inProgress.length} icon={BookOpen} />
        <StatCard label="Courses completed" value={completed} icon={CircleCheck} tone="green" />
        <StatCard label="Certificates earned" value={data.certificates} icon={Award} tone="amber" to="/student/certificates" />
      </div>

      {current ? (
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-5">
            <CourseThumbnail course={current.course} className="h-full md:col-span-2 md:aspect-auto" />
            <div className="flex flex-col justify-center p-6 md:col-span-3">
              <p className="eyebrow">Continue learning</p>
              <h2 className="mt-2 text-xl font-bold">{current.course.title}</h2>
              <p className="mt-1 text-sm text-slate-500">with {current.course.teacher?.full_name}</p>
              <div className="mt-5 flex items-center gap-3">
                <ProgressBar value={current.percent} />
                <span className="shrink-0 text-sm font-semibold text-slate-700">{current.percent}%</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {current.completed} of {current.total} lessons completed
              </p>
              <Button to={`/learn/${current.course.slug}`} className="mt-5 self-start">
                <PlayCircle className="h-4 w-4" /> Resume course
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState icon={Compass} title="Start your first course" description="Browse our free catalog and enroll in a course that matches your goals." action={<Button to="/courses">Browse courses</Button>} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="My courses" action={<Link to="/student/courses" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.enrollments.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link to={`/learn/${e.course.slug}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                  <CourseThumbnail course={e.course} className="!w-24 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{e.course.title}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar value={e.percent} className="max-w-xs" />
                      <span className="text-xs font-medium text-slate-500">{e.percent}%</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </li>
            ))}
            {data.enrollments.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">You haven't enrolled in any courses yet.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Announcements" action={<Link to="/announcements" className="text-sm font-semibold text-brand-600 hover:underline">All</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.announcements.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <p className="text-xs text-slate-500">{a.course?.title || 'SkillRise Academy'} · {timeAgo(a.created_at)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
              </li>
            ))}
            {data.announcements.length === 0 && (
              <li className="flex flex-col items-center px-5 py-8 text-center text-sm text-slate-500">
                <Bell className="mb-2 h-6 w-6 text-slate-300" /> No announcements yet
              </li>
            )}
          </ul>
        </Card>
      </div>

      {data.recommended.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold">Recommended for you</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
