import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CircleCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { fetchMyEnrollments } from '../../lib/queries'
import { useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CourseThumbnail } from '../../components/shared'
import { Badge, Button, EmptyState, PageHeader, PageLoader, ProgressBar, Tabs } from '../../components/ui'

export default function MyCourses() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState('progress')
  const { data, loading } = useQuery(() => fetchMyEnrollments(user.id), [user.id])
  if (loading) return <PageLoader />

  const inProgress = data.filter((e) => !e.completed_at)
  const completed = data.filter((e) => e.completed_at)
  const list = tab === 'progress' ? inProgress : completed

  return (
    <>
      <PageHeader title={t('portalNav.myCourses')} description={t('student.myCourses.description')} actions={<Button to="/courses" variant="secondary">{t('student.myCourses.browse')}</Button>} />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'progress', label: t('student.myCourses.inProgress'), count: t('common.number', { n: inProgress.length }) },
          { value: 'completed', label: t('student.myCourses.completed'), count: t('common.number', { n: completed.length }) },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={tab === 'progress' ? t('student.myCourses.noProgress') : t('student.myCourses.noCompleted')}
          description={tab === 'progress' ? t('student.myCourses.noProgressHint') : t('student.myCourses.noCompletedHint')}
          action={tab === 'progress' && <Button to="/courses">{t('portalNav.browseCourses')}</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <Link key={e.id} to={`/learn/${e.course.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-lift">
              <CourseThumbnail course={e.course} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">{e.course.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{e.course.teacher?.full_name}</p>
                <div className="mt-auto pt-5">
                  {e.completed_at ? (
                    <Badge tone="green">
                      <CircleCheck className="h-3.5 w-3.5" /> {t('student.myCourses.completedOn', { date: formatDate(e.completed_at) })}
                    </Badge>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{t('student.myCourses.lessonsProgress', { done: e.completed, total: e.total })}</span>
                        <span className="font-semibold text-slate-700">{t('student.percent', { n: e.percent })}</span>
                      </div>
                      <ProgressBar value={e.percent} className="mt-2" />
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
