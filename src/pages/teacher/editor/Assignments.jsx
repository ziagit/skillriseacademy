import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { errorMessage, formatDateTime } from '../../../lib/utils'
import { useConfirm } from '../../../components/shared'
import { Badge, Button, Card, EmptyState, Input, Modal, PageLoader, Textarea } from '../../../components/ui'

// datetime-local needs "YYYY-MM-DDTHH:mm" in local time.
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function Assignments({ courseId }) {
  const confirm = useConfirm()
  const [modal, setModal] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('assignments').select('*, submissions(count)').eq('course_id', courseId).order('created_at')),
    [courseId],
  )

  const remove = async (a) => {
    if (!(await confirm({ title: 'Delete assignment?', message: `"${a.title}" and all learner submissions will be deleted.`, danger: true, confirmLabel: 'Delete' }))) return
    const { error } = await supabase.from('assignments').delete().eq('id', a.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Practical tasks learners submit for you to grade. Grade them from the Submissions page.</p>
        <Button onClick={() => setModal({})}><Plus className="h-4 w-4" /> New assignment</Button>
      </div>
      {data.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Assignments help learners practise and get feedback from you." action={<Button onClick={() => setModal({})}>Create assignment</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {data.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.max_points} points{a.due_date && ` · Due ${formatDateTime(a.due_date)}`}
                  </p>
                </div>
                <Badge>{a.submissions?.[0]?.count || 0} submissions</Badge>
                <Button variant="ghost" size="icon" onClick={() => setModal(a)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => remove(a)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <AssignmentModal state={modal} courseId={courseId} onClose={() => setModal(null)} onSaved={reload} />
    </div>
  )
}

function AssignmentModal({ state, courseId, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [lastState, setLastState] = useState(null)
  if (state !== lastState) {
    setLastState(state)
    setForm({ title: state?.title || '', instructions: state?.instructions || '', max_points: state?.max_points ?? 100, due_date: toLocalInput(state?.due_date) })
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = { ...form, max_points: parseInt(form.max_points, 10) || 100, due_date: form.due_date ? new Date(form.due_date).toISOString() : null }
    const { error } = state.id ? await supabase.from('assignments').update(payload).eq('id', state.id) : await supabase.from('assignments').insert({ ...payload, course_id: courseId })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    onClose()
    onSaved()
  }

  return (
    <Modal open={!!state} onClose={onClose} size="lg" title={state?.id ? 'Edit assignment' : 'New assignment'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="assignment-form" loading={busy}>Save</Button></>}>
      <form id="assignment-form" onSubmit={save} className="space-y-4">
        <Input label="Title" required value={form.title} onChange={set('title')} placeholder="e.g. Design a logo for a local bakery" />
        <Textarea label="Instructions" rows={7} hint="Markdown supported. Explain what to submit and how it will be graded." value={form.instructions} onChange={set('instructions')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Max points" type="number" min={1} value={form.max_points} onChange={set('max_points')} />
          <Input label="Due date (optional)" type="datetime-local" value={form.due_date} onChange={set('due_date')} />
        </div>
      </form>
    </Modal>
  )
}
