import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Layers, Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { errorMessage, formatMinutes, toEmbedUrl } from '../../../lib/utils'
import { useConfirm, VideoEmbed } from '../../../components/shared'
import { Badge, Button, Card, Checkbox, EmptyState, Input, Modal, PageLoader, Textarea } from '../../../components/ui'

export default function Curriculum({ courseId, onChanged }) {
  const confirm = useConfirm()
  const [moduleModal, setModuleModal] = useState(null)
  const [lessonModal, setLessonModal] = useState(null)
  const { data: modules, loading, reload } = useQuery(async () => {
    const data = unwrap(await supabase.from('modules').select('*, lessons(*)').eq('course_id', courseId).order('position'))
    data.forEach((m) => m.lessons.sort((a, b) => a.position - b.position))
    return data
  }, [courseId])

  const refresh = () => {
    reload()
    onChanged?.()
  }

  const swap = async (table, a, b) => {
    const res = await Promise.all([
      supabase.from(table).update({ position: b.position }).eq('id', a.id),
      supabase.from(table).update({ position: a.position }).eq('id', b.id),
    ])
    const err = res.find((r) => r.error)?.error
    if (err) toast.error(errorMessage(err))
    reload()
  }

  // Positions may collide after deletes; normalise before swapping.
  const move = async (table, list, index, dir) => {
    const target = index + dir
    if (target < 0 || target >= list.length) return
    const normalised = list.map((item, i) => ({ ...item, position: i }))
    if (list.some((item, i) => item.position !== i)) {
      await Promise.all(normalised.map((item) => supabase.from(table).update({ position: item.position }).eq('id', item.id)))
    }
    swap(table, normalised[index], normalised[target])
  }

  const deleteModule = async (m) => {
    if (!(await confirm({ title: 'Delete section?', message: `"${m.title}" and its ${m.lessons.length} lessons will be deleted.`, danger: true, confirmLabel: 'Delete' }))) return
    const { error } = await supabase.from('modules').delete().eq('id', m.id)
    if (error) return toast.error(errorMessage(error))
    refresh()
  }

  const deleteLesson = async (l) => {
    if (!(await confirm({ title: 'Delete lesson?', message: `"${l.title}" will be deleted, along with learners' progress for it.`, danger: true, confirmLabel: 'Delete' }))) return
    const { error } = await supabase.from('lessons').delete().eq('id', l.id)
    if (error) return toast.error(errorMessage(error))
    refresh()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Organise your course into sections, then add video lessons to each section.</p>
        <Button onClick={() => setModuleModal({})}><Plus className="h-4 w-4" /> Add section</Button>
      </div>

      {modules.length === 0 && (
        <EmptyState icon={Layers} title="Start with a section" description='Sections group related lessons, e.g. "Getting started" or "Advanced techniques".' action={<Button onClick={() => setModuleModal({})}>Add first section</Button>} />
      )}

      {modules.map((m, mi) => (
        <Card key={m.id}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Section {mi + 1}</p>
              <p className="font-semibold text-slate-900">{m.title}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => move('modules', modules, mi, -1)} disabled={mi === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => move('modules', modules, mi, 1)} disabled={mi === modules.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setModuleModal(m)} aria-label="Rename"><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteModule(m)} className="hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {m.lessons.map((l, li) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <PlayCircle className={l.video_url ? 'h-5 w-5 shrink-0 text-brand-500' : 'h-5 w-5 shrink-0 text-slate-300'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{l.title}</p>
                  <p className="text-xs text-slate-500">
                    {l.duration_minutes ? formatMinutes(l.duration_minutes) : 'No duration'}
                    {!l.video_url && ' · No video'}
                  </p>
                </div>
                {l.is_preview && <Badge tone="blue">Free preview</Badge>}
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => move('lessons', m.lessons, li, -1)} disabled={li === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move('lessons', m.lessons, li, 1)} disabled={li === m.lessons.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setLessonModal({ lesson: l, module: m })} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteLesson(l)} className="hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3">
            <Button variant="soft" size="sm" onClick={() => setLessonModal({ module: m })}><Plus className="h-4 w-4" /> Add lesson</Button>
          </div>
        </Card>
      ))}

      <ModuleModal state={moduleModal} courseId={courseId} nextPosition={modules.length} onClose={() => setModuleModal(null)} onSaved={refresh} />
      <LessonModal state={lessonModal} courseId={courseId} onClose={() => setLessonModal(null)} onSaved={refresh} />
    </div>
  )
}

function ModuleModal({ state, courseId, nextPosition, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastState, setLastState] = useState(null)
  if (state !== lastState) {
    setLastState(state)
    setTitle(state?.title || '')
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = state.id
      ? await supabase.from('modules').update({ title }).eq('id', state.id)
      : await supabase.from('modules').insert({ title, course_id: courseId, position: nextPosition })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    onClose()
    onSaved()
  }

  return (
    <Modal open={!!state} onClose={onClose} title={state?.id ? 'Rename section' : 'New section'} size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="module-form" loading={busy}>Save</Button></>}>
      <form id="module-form" onSubmit={save}>
        <Input label="Section title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Getting started" />
      </form>
    </Modal>
  )
}

const emptyLesson = { title: '', video_url: '', duration_minutes: '', content: '', is_preview: false }

function LessonModal({ state, courseId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyLesson)
  const [busy, setBusy] = useState(false)
  const [lastState, setLastState] = useState(null)
  if (state !== lastState) {
    setLastState(state)
    setForm(state?.lesson ? { ...emptyLesson, ...state.lesson, video_url: state.lesson.video_url || '', content: state.lesson.content || '', duration_minutes: state.lesson.duration_minutes || '' } : emptyLesson)
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const videoValid = !form.video_url || toEmbedUrl(form.video_url)

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      title: form.title,
      video_url: form.video_url.trim() || null,
      content: form.content || null,
      duration_minutes: parseInt(form.duration_minutes, 10) || 0,
      is_preview: form.is_preview,
    }
    const { error } = state.lesson
      ? await supabase.from('lessons').update(payload).eq('id', state.lesson.id)
      : await supabase.from('lessons').insert({ ...payload, course_id: courseId, module_id: state.module.id, position: state.module.lessons.length })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success('Lesson saved')
    onClose()
    onSaved()
  }

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="xl"
      title={state?.lesson ? 'Edit lesson' : 'New lesson'}
      description={state?.module?.title}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="lesson-form" loading={busy}>Save lesson</Button></>}
    >
      <form id="lesson-form" onSubmit={save} className="grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          <Input label="Lesson title" required value={form.title} onChange={set('title')} />
          <Input label="Video URL" placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" value={form.video_url} onChange={set('video_url')} error={!videoValid ? 'Use a YouTube or Vimeo link' : null} hint="Paste a YouTube (public or unlisted) or Vimeo link." />
          <Input label="Duration (minutes)" type="number" min={0} value={form.duration_minutes} onChange={set('duration_minutes')} />
          <Checkbox label="Free preview" description="Anyone can watch this lesson from the course page." checked={form.is_preview} onChange={set('is_preview')} />
        </div>
        <div>{form.video_url && videoValid ? <VideoEmbed url={form.video_url} /> : <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">Video preview</div>}</div>
        <Textarea label="Lesson notes" rows={10} className="md:col-span-2" hint="Markdown supported. Add key points, links, resources or a written tutorial." value={form.content} onChange={set('content')} />
      </form>
    </Modal>
  )
}
