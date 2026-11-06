import { useState } from 'react'
import toast from 'react-hot-toast'
import { CircleCheck, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { cn, errorMessage } from '../../../lib/utils'
import { useI18n } from '../../../lib/i18n'
import { useConfirm } from '../../../components/shared'
import { Badge, Button, Card, EmptyState, Input, Modal, PageLoader, Select, Textarea } from '../../../components/ui'

export default function Quizzes({ courseId }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [quizModal, setQuizModal] = useState(null)
  const [questionModal, setQuestionModal] = useState(null)
  const { data, loading, reload } = useQuery(async () => {
    const [quizzes, modules] = await Promise.all([
      supabase.from('quizzes').select('*, quiz_questions(id, question, options, position, quiz_answer_keys(correct_index))').eq('course_id', courseId).order('position'),
      supabase.from('modules').select('id, title').eq('course_id', courseId).order('position'),
    ])
    const list = unwrap(quizzes)
    list.forEach((q) => q.quiz_questions.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)))
    return { quizzes: list, modules: unwrap(modules) }
  }, [courseId])

  const removeQuiz = async (q) => {
    if (!(await confirm({ title: t('quizEd.deleteQuizTitle'), message: t('quizEd.deleteQuizMessage', { title: q.title }), danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from('quizzes').delete().eq('id', q.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  const removeQuestion = async (qq) => {
    if (!(await confirm({ title: t('quizEd.deleteQuestionTitle'), message: qq.question, danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from('quiz_questions').delete().eq('id', qq.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{t('quizEd.intro')}</p>
        <Button onClick={() => setQuizModal({})}><Plus className="h-4 w-4" /> {t('quizEd.newQuiz')}</Button>
      </div>

      {data.quizzes.length === 0 && <EmptyState icon={ListChecks} title={t('quizEd.empty')} description={t('quizEd.emptyHint')} action={<Button onClick={() => setQuizModal({})}>{t('quizEd.create')}</Button>} />}

      {data.quizzes.map((q) => (
        <Card key={q.id}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p dir="auto" className="font-semibold text-slate-900">{q.title}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                <Badge tone="violet">{t('quizEd.pass', { n: q.pass_percent })}</Badge>
                <Badge>{data.modules.find((m) => m.id === q.module_id)?.title || t('player.finalAssessment')}</Badge>
                <span className="self-center">{t('player.questionCount', { count: q.quiz_questions.length })}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setQuizModal(q)} aria-label={t('quizEd.editQuiz')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => removeQuiz(q)} aria-label={t('quizEd.deleteQuiz')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <ol className="divide-y divide-slate-100">
            {q.quiz_questions.map((qq, i) => {
              const correct = qq.quiz_answer_keys?.correct_index ?? qq.quiz_answer_keys?.[0]?.correct_index
              return (
                <li key={qq.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="mt-0.5 text-sm font-semibold text-slate-400">{t('player.questionNumber', { n: i + 1 })}</span>
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="text-sm font-medium text-slate-900">{qq.question}</p>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                      {qq.options.map((o, oi) => (
                        <li key={oi} className={cn('flex items-center gap-2 text-xs', oi === correct ? 'font-semibold text-emerald-700' : 'text-slate-500')}>
                          {oi === correct ? <CircleCheck className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                          {o}
                        </li>
                      ))}
                    </ul>
                    {correct == null && <p className="mt-2 text-xs font-medium text-red-600">{t('quizEd.noCorrect')}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setQuestionModal({ quiz: q, question: { ...qq, correct } })} aria-label={t('quizEd.editQuestion')}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => removeQuestion(qq)} aria-label={t('quizEd.deleteQuestion')}><Trash2 className="h-4 w-4" /></Button>
                </li>
              )
            })}
          </ol>
          <div className="px-5 py-3">
            <Button variant="soft" size="sm" onClick={() => setQuestionModal({ quiz: q })}><Plus className="h-4 w-4" /> {t('quizEd.addQuestion')}</Button>
          </div>
        </Card>
      ))}

      <QuizModal state={quizModal} courseId={courseId} modules={data.modules} position={data.quizzes.length} onClose={() => setQuizModal(null)} onSaved={reload} />
      <QuestionModal state={questionModal} onClose={() => setQuestionModal(null)} onSaved={reload} />
    </div>
  )
}

function QuizModal({ state, courseId, modules, position, onClose, onSaved }) {
  const { t } = useI18n()
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [lastState, setLastState] = useState(null)
  if (state !== lastState) {
    setLastState(state)
    setForm({ title: state?.title || '', description: state?.description || '', pass_percent: state?.pass_percent ?? 70, module_id: state?.module_id || '' })
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = { ...form, module_id: form.module_id || null, pass_percent: Math.min(100, Math.max(0, parseInt(form.pass_percent, 10) || 0)) }
    const { error } = state.id ? await supabase.from('quizzes').update(payload).eq('id', state.id) : await supabase.from('quizzes').insert({ ...payload, course_id: courseId, position })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    onClose()
    onSaved()
  }

  return (
    <Modal open={!!state} onClose={onClose} title={state?.id ? t('quizEd.editQuiz') : t('quizEd.newQuiz')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="quiz-form" loading={busy}>{t('quizEd.saveQuiz')}</Button></>}>
      <form id="quiz-form" onSubmit={save} className="space-y-4">
        <Input label={t('quizEd.quizTitle')} required value={form.title} onChange={set('title')} placeholder={t('quizEd.quizTitlePlaceholder')} />
        <Textarea label={t('quizEd.instructions')} rows={2} value={form.description} onChange={set('description')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('quizEd.showAfter')} value={form.module_id} onChange={set('module_id')}>
            <option value="">{t('quizEd.finalOption')}</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </Select>
          <Input label={t('quizEd.passMark')} type="number" min={0} max={100} value={form.pass_percent} onChange={set('pass_percent')} />
        </div>
      </form>
    </Modal>
  )
}

function QuestionModal({ state, onClose, onSaved }) {
  const { t } = useI18n()
  const [form, setForm] = useState({ question: '', options: ['', ''], correct: 0 })
  const [busy, setBusy] = useState(false)
  const [lastState, setLastState] = useState(null)
  if (state !== lastState) {
    setLastState(state)
    setForm(state?.question ? { question: state.question.question, options: [...state.question.options], correct: state.question.correct ?? 0 } : { question: '', options: ['', '', '', ''], correct: 0 })
  }

  const save = async (e) => {
    e.preventDefault()
    const options = form.options.map((o) => o.trim())
    if (options.some((o) => !o)) return toast.error(t('quizEd.fillOptions'))
    setBusy(true)
    let questionId = state.question?.id
    if (questionId) {
      const { error } = await supabase.from('quiz_questions').update({ question: form.question, options }).eq('id', questionId)
      if (error) { setBusy(false); return toast.error(errorMessage(error)) }
    } else {
      const { data, error } = await supabase.from('quiz_questions').insert({ quiz_id: state.quiz.id, question: form.question, options, position: state.quiz.quiz_questions.length }).select('id').single()
      if (error) { setBusy(false); return toast.error(errorMessage(error)) }
      questionId = data.id
    }
    const { error } = await supabase.from('quiz_answer_keys').upsert({ question_id: questionId, correct_index: form.correct })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    onClose()
    onSaved()
  }

  return (
    <Modal open={!!state} onClose={onClose} size="lg" title={state?.question ? t('quizEd.editQuestion') : t('quizEd.newQuestion')} description={state?.quiz?.title} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="question-form" loading={busy}>{t('quizEd.saveQuestion')}</Button></>}>
      <form id="question-form" onSubmit={save} className="space-y-5">
        <Textarea label={t('quizEd.question')} required rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">{t('quizEd.options')} <span className="font-normal text-slate-500">{t('quizEd.optionsHint')}</span></p>
          {form.options.map((o, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" name="correct" className="h-4 w-4 text-emerald-600" checked={form.correct === i} onChange={() => setForm({ ...form, correct: i })} aria-label={t('quizEd.optionCorrect', { n: i + 1 })} />
              <input className={cn('input', form.correct === i && 'border-emerald-400 ring-2 ring-emerald-100')} placeholder={t('quizEd.option', { n: i + 1 })} value={o} onChange={(e) => setForm({ ...form, options: form.options.map((v, j) => (j === i ? e.target.value : v)) })} />
              {form.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('quizEd.removeOption')}
                  onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i), correct: form.correct === i ? 0 : form.correct > i ? form.correct - 1 : form.correct })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <Button type="button" variant="soft" size="sm" onClick={() => setForm({ ...form, options: [...form.options, ''] })}>
              <Plus className="h-4 w-4" /> {t('quizEd.addOption')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
