import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardList, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDateTime, timeAgo } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { Avatar, Button, Card, EmptyState, Input, Modal, PageHeader, PageLoader, Select, StatusBadge, Tabs, Textarea } from '../../components/ui'

export default function Submissions() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState('submitted')
  const [courseFilter, setCourseFilter] = useState('')
  const [grading, setGrading] = useState(null)

  const { data, loading, reload } = useQuery(async () => {
    const courses = unwrap(await supabase.from('courses').select('id, title').eq('teacher_id', user.id).order('title'))
    if (!courses.length) return { courses, submissions: [] }
    const submissions = unwrap(
      await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, max_points, instructions), course:courses(title), student:profiles!submissions_student_id_fkey(full_name, avatar_url)')
        .in('course_id', courses.map((c) => c.id))
        .order('submitted_at', { ascending: false }),
    )
    return { courses, submissions }
  }, [user.id])

  if (loading) return <PageLoader />
  const list = data.submissions.filter((s) => (tab === 'all' || s.status === tab) && (!courseFilter || s.course_id === courseFilter))
  const count = (status) => data.submissions.filter((s) => s.status === status && (!courseFilter || s.course_id === courseFilter)).length

  return (
    <>
      <PageHeader
        title={t('portalNav.submissions')}
        description={t('subs.description')}
        actions={
          data.courses.length > 1 && (
            <select className="input w-56" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">{t('footer.allCourses')}</option>
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )
        }
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'submitted', label: t('teacher.dash.needsGrading'), count: t('common.number', { n: count('submitted') }) },
          { value: 'graded', label: t('status.graded'), count: t('common.number', { n: count('graded') }) },
          { value: 'all', label: t('common.all') },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={tab === 'submitted' ? t('subs.caughtUp') : t('subs.none')} description={t('subs.noneHint')} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('studentsTab.learner')}</th>
                  <th>{t('subs.assignment')}</th>
                  <th>{t('status.submitted')}</th>
                  <th>{t('studentsTab.status')}</th>
                  <th>{t('subs.grade')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={s.student?.avatar_url} name={s.student?.full_name} size="sm" />
                        <span className="font-medium text-slate-900">{s.student?.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <p dir="auto" className="font-medium text-slate-800">{s.assignment?.title}</p>
                      <p className="text-xs text-slate-500">{s.course?.title}</p>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{timeAgo(s.submitted_at)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="whitespace-nowrap">{s.grade != null ? t('subs.score', { grade: s.grade, max: s.assignment?.max_points }) : '—'}</td>
                    <td className="text-end">
                      <Button size="sm" variant={s.status === 'submitted' ? 'primary' : 'secondary'} onClick={() => setGrading(s)}>
                        {s.status === 'submitted' ? t('subs.gradeAction') : t('subs.review')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <GradeModal submission={grading} onClose={() => setGrading(null)} onSaved={reload} />
    </>
  )
}

function GradeModal({ submission, onClose, onSaved }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [form, setForm] = useState({ grade: '', feedback: '', status: 'graded' })
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  if (submission !== last) {
    setLast(submission)
    setForm({ grade: submission?.grade ?? '', feedback: submission?.feedback || '', status: submission?.status === 'returned' ? 'returned' : 'graded' })
  }
  if (!submission) return null
  const max = submission.assignment?.max_points || 100

  const save = async (e) => {
    e.preventDefault()
    const grade = form.status === 'graded' ? parseInt(form.grade, 10) : null
    if (form.status === 'graded' && (Number.isNaN(grade) || grade < 0 || grade > max)) return toast.error(t('subs.gradeRange', { max }))
    setBusy(true)
    const { error } = await supabase
      .from('submissions')
      .update({ grade, feedback: form.feedback, status: form.status, graded_by: user.id, graded_at: new Date().toISOString() })
      .eq('id', submission.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(form.status === 'graded' ? t('subs.gradeSaved') : t('subs.returned'))
    onClose()
    onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={submission.assignment?.title}
      description={t('subs.modalDescription', { name: submission.student?.full_name, date: formatDateTime(submission.submitted_at) })}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="grade-form" loading={busy}>{t('common.save')}</Button></>}
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">{t('subs.learnerSubmission')}</p>
          {submission.content && <p dir="auto" className="mt-2 whitespace-pre-line text-slate-800">{submission.content}</p>}
          {submission.link_url && (
            <a href={submission.link_url} target="_blank" rel="noreferrer" dir="ltr" className="mt-2 inline-flex items-center gap-1 break-all font-medium text-brand-600 hover:underline">
              {submission.link_url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}
        </div>
        <form id="grade-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('subs.outcome')} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="graded">{t('subs.gradeSubmission')}</option>
              <option value="returned">{t('subs.returnForChanges')}</option>
            </Select>
            {form.status === 'graded' && <Input label={t('subs.gradeOutOf', { max })} type="number" min={0} max={max} required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />}
          </div>
          <Textarea label={t('subs.feedback')} rows={5} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder={t('subs.feedbackPlaceholder')} />
        </form>
      </div>
    </Modal>
  )
}
