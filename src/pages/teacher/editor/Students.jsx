import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { formatDate } from '../../../lib/utils'
import { useI18n } from '../../../lib/i18n'
import { Avatar, Badge, Card, EmptyState, PageLoader, ProgressBar, SearchInput } from '../../../components/ui'

export default function Students({ courseId }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const { data, loading } = useQuery(async () => {
    const [enrollments, progress, lessons] = await Promise.all([
      supabase.from('enrollments').select('id, enrolled_at, completed_at, student:profiles!enrollments_student_id_fkey(id, full_name, avatar_url, country)').eq('course_id', courseId).order('enrolled_at', { ascending: false }),
      supabase.from('lesson_progress').select('student_id').eq('course_id', courseId),
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    ])
    const done = {}
    for (const p of unwrap(progress) || []) done[p.student_id] = (done[p.student_id] || 0) + 1
    return { enrollments: unwrap(enrollments) || [], done, total: lessons.count || 0 }
  }, [courseId])

  const rows = useMemo(() => (data?.enrollments || []).filter((e) => !search || e.student?.full_name?.toLowerCase().includes(search.toLowerCase())), [data, search])

  if (loading) return <PageLoader />
  if (!data.enrollments.length) return <EmptyState icon={Users} title={t('studentsTab.empty')} description={t('studentsTab.emptyHint')} />

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <p className="text-sm font-medium text-slate-700">{t('studentsTab.enrolled', { count: data.enrollments.length })}</p>
        <SearchInput value={search} onChange={setSearch} placeholder={t('studentsTab.search')} className="w-full sm:w-64" />
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t('studentsTab.learner')}</th>
              <th>{t('studentsTab.enrolledCol')}</th>
              <th className="w-56">{t('studentsTab.progress')}</th>
              <th>{t('studentsTab.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const done = data.done[e.student?.id] || 0
              const pct = data.total ? Math.round((done / data.total) * 100) : 0
              return (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={e.student?.avatar_url} name={e.student?.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{e.student?.full_name || t('studentsTab.learner')}</p>
                        {e.student?.country && <p className="text-xs text-slate-500">{e.student.country}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(e.enrolled_at)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={pct} />
                      <span className="w-10 text-xs font-medium text-slate-600">{t('student.percent', { n: pct })}</span>
                    </div>
                  </td>
                  <td>{e.completed_at ? <Badge tone="green">{t('student.myCourses.completed')}</Badge> : <Badge>{t('student.myCourses.inProgress')}</Badge>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
