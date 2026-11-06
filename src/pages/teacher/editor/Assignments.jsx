import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { errorMessage, formatDateTime } from '../../../lib/utils'
import { useI18n } from '../../../lib/i18n'
import { useConfirm } from '../../../components/shared'
import { Badge, Button, Card, EmptyState, Input, Modal, PageLoader, Textarea } from '../../../components/ui'

// datetime-local needs "YYYY-MM-DDTHH:mm" in local time.
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function Assignments({ courseId }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [modal, setModal] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('assignments').select('*, submissions(count)').eq('course_id', courseId).order('created_at')),
    [courseId],
  )

  const remove = async (a) => {
    if (!(await confirm({ title: t('assignEd.deleteTitle'), message: t('assignEd.deleteMessage', { title: a.title }), danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from('assignments').delete().eq('id', a.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{t('assignEd.intro')}</p>
        <Button onClick={() => setModal({})}><Plus className="h-4 w-4" /> {t('assignEd.new')}</Button>
      </div>
      {data.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('assignEd.empty')} description={t('assignEd.emptyHint')} action={<Button onClick={() => setModal({})}>{t('assignEd.create')}</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {data.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {t('player.points', { count: a.max_points })}{a.due_date && ` · ${t('player.due', { date: formatDateTime(a.due_date) })}`}
                  </p>
                </div>
                <Badge>{t('assignEd.submissionCount', { count: a.submissions?.[0]?.count || 0 })}</Badge>
                <Button variant="ghost" size="icon" onClick={() => setModal(a)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => remove(a)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
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
  const { t } = useI18n()
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
    <Modal open={!!state} onClose={onClose} size="lg" title={state?.id ? t('assignEd.edit') : t('assignEd.new')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="assignment-form" loading={busy}>{t('common.save')}</Button></>}>
      <form id="assignment-form" onSubmit={save} className="space-y-4">
        <Input label={t('teacher.title')} required value={form.title} onChange={set('title')} placeholder={t('assignEd.titlePlaceholder')} />
        <Textarea label={t('quizEd.instructions')} rows={7} hint={t('assignEd.instructionsHint')} value={form.instructions} onChange={set('instructions')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('assignEd.maxPoints')} type="number" min={1} value={form.max_points} onChange={set('max_points')} />
          <Input label={t('assignEd.dueDate')} type="datetime-local" value={form.due_date} onChange={set('due_date')} />
        </div>
      </form>
    </Modal>
  )
}
