import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Eye, Pencil, Plus, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, slugify, timeAgo, uniqueSlug } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CourseThumbnail } from '../../components/shared'
import { Button, EmptyState, Input, Modal, PageHeader, PageLoader, Select, StatusBadge } from '../../components/ui'

export function useCategories() {
  return useQuery(async () => unwrap(await supabase.from('categories').select('*').order('sort_order')), [])
}

export function NewCourseModal({ open, onClose }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const [form, setForm] = useState({ title: '', category_id: '' })
  const [busy, setBusy] = useState(false)

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { data: existing } = await supabase.from('courses').select('id').eq('slug', slugify(form.title)).maybeSingle()
    const { data, error } = await supabase
      .from('courses')
      .insert({ title: form.title, category_id: form.category_id || null, teacher_id: user.id, slug: existing ? uniqueSlug(form.title) : slugify(form.title) || uniqueSlug('course') })
      .select('id')
      .single()
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('teacher.courses.created'))
    navigate(`/teacher/courses/${data.id}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('teacher.courses.newTitle')}
      description={t('teacher.courses.newHint')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="new-course" loading={busy}>{t('teacher.courses.create')}</Button>
        </>
      }
    >
      <form id="new-course" onSubmit={create} className="space-y-4">
        <Input label={t('teacher.courses.courseTitle')} required autoFocus placeholder={t('teacher.courses.titlePlaceholder')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Select label={t('teacher.category')} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">{t('teacher.courses.selectCategory')}</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </form>
    </Modal>
  )
}

export default function TeacherCourses() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const { data, loading } = useQuery(
    async () => unwrap(await supabase.from('courses').select('id, title, slug, status, subtitle, thumbnail_url, updated_at, review_note, category:categories(name, icon, color), enrollments(count), lessons(count)').eq('teacher_id', user.id).order('updated_at', { ascending: false })),
    [user.id],
  )
  const openNew = params.get('new') === '1'

  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title={t('portalNav.myCourses')} description={t('teacher.courses.description')} actions={<Button onClick={() => setParams({ new: '1' })}><Plus className="h-4 w-4" /> {t('teacher.newCourse')}</Button>} />
      {data.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('teacher.courses.empty')} description={t('teacher.courses.emptyHint')} action={<Button onClick={() => setParams({ new: '1' })}>{t('teacher.courses.create')}</Button>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
              <div className="relative">
                <CourseThumbnail course={c} />
                <div className="absolute start-3 top-3"><StatusBadge status={c.status} /></div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-medium text-brand-600">{c.category?.name || t('teacher.uncategorized')}</p>
                <h3 dir="auto" className="mt-1 line-clamp-2 font-semibold text-slate-900">{c.title}</h3>
                <p className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{t('course.lessonCount', { count: c.lessons?.[0]?.count || 0 })}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t('common.number', { n: c.enrollments?.[0]?.count || 0 })}</span>
                  <span>{t('teacher.updatedCap', { time: timeAgo(c.updated_at) })}</span>
                </p>
                {c.review_note && c.status === 'draft' && <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">{t('teacher.reviewerNote', { note: c.review_note })}</p>}
                <div className="mt-auto flex gap-2 pt-5">
                  <Button to={`/teacher/courses/${c.id}`} size="sm" className="flex-1"><Pencil className="h-3.5 w-3.5" /> {t('common.edit')}</Button>
                  <Button to={`/courses/${c.slug}`} size="sm" variant="secondary"><Eye className="h-3.5 w-3.5" /> {t('common.view')}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <NewCourseModal open={openNew} onClose={() => setParams({})} />
    </>
  )
}

