import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardList, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDateTime, timeAgo } from '../../lib/utils'
import { Avatar, Button, Card, EmptyState, Input, Modal, PageHeader, PageLoader, Select, StatusBadge, Tabs, Textarea } from '../../components/ui'

export default function Submissions() {
  const { user } = useAuth()
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
        title="Submissions"
        description="Review learners' assignments and give feedback."
        actions={
          data.courses.length > 1 && (
            <select className="input w-56" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">All courses</option>
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
          { value: 'submitted', label: 'Needs grading', count: count('submitted') },
          { value: 'graded', label: 'Graded', count: count('graded') },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={tab === 'submitted' ? 'All caught up!' : 'No submissions'} description="Submissions from your learners will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Assignment</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Grade</th>
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
                      <p className="font-medium text-slate-800">{s.assignment?.title}</p>
                      <p className="text-xs text-slate-500">{s.course?.title}</p>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{timeAgo(s.submitted_at)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="whitespace-nowrap">{s.grade != null ? `${s.grade}/${s.assignment?.max_points}` : '—'}</td>
                    <td className="text-right">
                      <Button size="sm" variant={s.status === 'submitted' ? 'primary' : 'secondary'} onClick={() => setGrading(s)}>
                        {s.status === 'submitted' ? 'Grade' : 'Review'}
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
    if (form.status === 'graded' && (Number.isNaN(grade) || grade < 0 || grade > max)) return toast.error(`Grade must be between 0 and ${max}`)
    setBusy(true)
    const { error } = await supabase
      .from('submissions')
      .update({ grade, feedback: form.feedback, status: form.status, graded_by: user.id, graded_at: new Date().toISOString() })
      .eq('id', submission.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(form.status === 'graded' ? 'Grade saved' : 'Returned to learner for changes')
    onClose()
    onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={submission.assignment?.title}
      description={`${submission.student?.full_name} · submitted ${formatDateTime(submission.submitted_at)}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="grade-form" loading={busy}>Save</Button></>}
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Learner's submission</p>
          {submission.content && <p className="mt-2 whitespace-pre-line text-slate-800">{submission.content}</p>}
          {submission.link_url && (
            <a href={submission.link_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 break-all font-medium text-brand-600 hover:underline">
              {submission.link_url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}
        </div>
        <form id="grade-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Outcome" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="graded">Grade submission</option>
              <option value="returned">Return for changes</option>
            </Select>
            {form.status === 'graded' && <Input label={`Grade (out of ${max})`} type="number" min={0} max={max} required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />}
          </div>
          <Textarea label="Feedback" rows={5} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="What went well, and what could be improved?" />
        </form>
      </div>
    </Modal>
  )
}
