import { Link } from 'react-router-dom'
import { Award, BookOpen, CircleCheck, FileText, GraduationCap, Inbox, UserCheck, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatNumber, timeAgo } from '../../lib/utils'
import { Avatar, Card, CardHeader, ErrorState, PageHeader, PageLoader, StatCard } from '../../components/ui'

// Single-series column chart: one hue, hover tooltip per bar, 4px rounded tops.
function ColumnChart({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div>
      <div className="flex h-48 items-end gap-3 border-b border-slate-200 pb-px" role="img" aria-label={label}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100">
              {d.label}: <strong>{formatNumber(d.value)}</strong>
            </div>
            <div className="w-full rounded-t-[4px] bg-brand-600 transition group-hover:bg-brand-700" style={{ height: `${Math.max(d.value ? 2 : 0, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-slate-500">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

// Horizontal bars for ranked categories; values are direct-labelled in text ink.
function BarList({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-500">No enrollments yet</p>
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group" title={`${d.label}: ${d.value}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate text-slate-700">{d.label}</span>
            <span className="font-semibold text-slate-900">{formatNumber(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600 transition group-hover:bg-brand-700" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function lastSixMonths(rows) {
  const counts = Object.fromEntries((rows || []).map((r) => [r.month, r.count]))
  const out = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: counts[key] || 0 })
  }
  return out
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useQuery(async () => {
    const [stats, pendingCourses, applications, messages] = await Promise.all([
      supabase.rpc('admin_stats'),
      supabase.from('courses').select('id, title, updated_at, teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url)').eq('status', 'pending').order('updated_at').limit(5),
      supabase.from('teacher_applications').select('id, expertise, created_at, user:profiles!teacher_applications_user_id_fkey(full_name, avatar_url)').eq('status', 'pending').order('created_at').limit(5),
      supabase.from('contact_messages').select('id, name, subject, created_at').eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    ])
    return { stats: unwrap(stats), pendingCourses: unwrap(pendingCourses), applications: unwrap(applications), messages: unwrap(messages) }
  }, [])

  if (loading) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />
  const s = data.stats

  return (
    <div className="space-y-8">
      <PageHeader title="Admin overview" description="A snapshot of SkillRise Academy's learners, teachers and content." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={formatNumber(s.students)} icon={Users} to="/admin/users" />
        <StatCard label="Teachers" value={formatNumber(s.teachers)} icon={GraduationCap} tone="violet" to="/admin/users" />
        <StatCard label="Published courses" value={formatNumber(s.courses_published)} icon={BookOpen} tone="green" to="/admin/courses" />
        <StatCard label="Certificates issued" value={formatNumber(s.certificates)} icon={Award} tone="amber" to="/admin/certificates" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrollments" value={formatNumber(s.enrollments)} hint={`${s.completions} completed`} icon={CircleCheck} tone="green" />
        <StatCard label="Courses to review" value={s.courses_pending} icon={BookOpen} tone="amber" to="/admin/courses?status=pending" />
        <StatCard label="Teacher applications" value={s.applications_pending} icon={UserCheck} tone="violet" to="/admin/applications" />
        <StatCard label="Unread messages" value={s.messages_unread} hint={`${s.posts_pending} blog posts to review`} icon={Inbox} tone="red" to="/admin/messages" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="New sign-ups" description="All accounts, last 6 months" />
          <div className="p-5 pt-8">
            <ColumnChart data={lastSixMonths(s.signups_by_month)} label="New sign-ups per month" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Enrollments by category" description="All time" />
          <div className="p-5">
            <BarList data={(s.enrollments_by_category || []).slice(0, 8).map((c) => ({ label: c.name, value: c.count }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <QueueCard title="Courses awaiting review" to="/admin/courses?status=pending" empty="No courses to review" items={data.pendingCourses.map((c) => ({ id: c.id, title: c.title, sub: `${c.teacher?.full_name} · ${timeAgo(c.updated_at)}`, avatar: c.teacher, href: `/teacher/courses/${c.id}` }))} />
        <QueueCard title="Teacher applications" to="/admin/applications" empty="No pending applications" items={data.applications.map((a) => ({ id: a.id, title: a.user?.full_name, sub: `${a.expertise} · ${timeAgo(a.created_at)}`, avatar: a.user, href: '/admin/applications' }))} />
        <QueueCard title="Unread messages" to="/admin/messages" empty="Inbox zero" icon={FileText} items={data.messages.map((m) => ({ id: m.id, title: m.name, sub: `${m.subject || 'No subject'} · ${timeAgo(m.created_at)}`, avatar: { full_name: m.name }, href: '/admin/messages' }))} />
      </div>
    </div>
  )
}

function QueueCard({ title, to, items, empty }) {
  return (
    <Card>
      <CardHeader title={title} action={<Link to={to} className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>} />
      <ul className="divide-y divide-slate-100">
        {items.map((i) => (
          <li key={i.id}>
            <Link to={i.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <Avatar src={i.avatar?.avatar_url} name={i.avatar?.full_name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{i.title}</p>
                <p className="truncate text-xs text-slate-500">{i.sub}</p>
              </div>
            </Link>
          </li>
        ))}
        {items.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">{empty}</li>}
      </ul>
    </Card>
  )
}
