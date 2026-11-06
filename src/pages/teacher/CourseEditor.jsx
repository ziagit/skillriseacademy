import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Bell, ClipboardList, Eye, FileText, Layers, ListChecks, Send, Trash2, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, LEVEL_KEYS, levelLabel, slugify } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { ImageUpload, ListEditor, useConfirm } from '../../components/shared'
import { Button, Card, CardHeader, Checkbox, EmptyState, Input, PageLoader, Select, StatusBadge, Tabs, Textarea } from '../../components/ui'
import { useCategories } from './TeacherCourses'
import Curriculum from './editor/Curriculum'
import Quizzes from './editor/Quizzes'
import Assignments from './editor/Assignments'
import Students from './editor/Students'
import CourseAnnouncementsTab from './editor/CourseAnnouncementsTab'

export default function CourseEditor() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'details'
  const { data: course, loading, reload } = useQuery(async () => unwrap(await supabase.from('courses').select('*, lessons(count)').eq('id', id).maybeSingle()), [id])

  if (loading) return <PageLoader />
  if (!course) return <EmptyState title={t('player.notFound')} action={<Button to="/teacher/courses">{t('teacher.editor.backToCourses')}</Button>} />

  const setStatus = async (status, message) => {
    const { error } = await supabase.from('courses').update({ status }).eq('id', course.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  const submitForReview = async () => {
    if (!course.lessons?.[0]?.count) return toast.error(t('teacher.editor.needLesson'))
    if (await confirm({ title: t('teacher.editor.submitTitle'), message: t('teacher.editor.submitMessage'), confirmLabel: t('teacher.editor.submit') })) {
      setStatus('pending', t('teacher.editor.submitted'))
    }
  }

  const remove = async () => {
    if (!(await confirm({ title: t('teacher.editor.deleteTitle'), message: t('teacher.editor.deleteMessage'), danger: true, confirmLabel: t('teacher.editor.deleteCourse') }))) return
    const { error } = await supabase.from('courses').delete().eq('id', course.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('teacher.editor.deleted'))
    navigate('/teacher/courses')
  }

  return (
    <>
      <div className="mb-6">
        <Link to={isAdmin ? '/admin/courses' : '/teacher/courses'} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {isAdmin ? t('footer.allCourses') : t('portalNav.myCourses')}
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 dir="auto" className="truncate text-2xl font-bold">{course.title}</h1>
              <StatusBadge status={course.status} />
            </div>
            {course.review_note && course.status === 'draft' && <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('teacher.reviewerNote', { note: course.review_note })}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to={`/courses/${course.slug}`} variant="secondary" size="sm"><Eye className="h-4 w-4" /> {t('courseDetail.preview')}</Button>
            {isAdmin ? (
              course.status !== 'published' ? (
                <Button size="sm" onClick={() => setStatus('published', t('teacher.editor.published'))}><Send className="h-4 w-4 rtl:-scale-x-100" /> {t('teacher.editor.publish')}</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setStatus('draft', t('teacher.editor.unpublished'))}>{t('teacher.editor.unpublish')}</Button>
              )
            ) : course.status === 'draft' ? (
              <Button size="sm" onClick={submitForReview}><Send className="h-4 w-4 rtl:-scale-x-100" /> {t('teacher.editor.submitForReview')}</Button>
            ) : course.status === 'pending' ? (
              <Button size="sm" variant="secondary" onClick={() => setStatus('draft', t('teacher.editor.movedToDraft'))}>{t('teacher.editor.withdraw')}</Button>
            ) : null}
            {(isAdmin || course.status === 'draft') && (
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={remove} aria-label={t('teacher.editor.deleteCourse')}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={(value) => setParams({ tab: value })}
        tabs={[
          { value: 'details', label: t('teacher.editor.tabDetails'), icon: FileText },
          { value: 'curriculum', label: t('teacher.editor.tabCurriculum'), icon: Layers },
          { value: 'quizzes', label: t('teacher.editor.tabQuizzes'), icon: ListChecks },
          { value: 'assignments', label: t('player.assignments'), icon: ClipboardList },
          { value: 'students', label: t('teacher.editor.tabStudents'), icon: Users },
          { value: 'announcements', label: t('portalNav.announcements'), icon: Bell },
        ]}
      />

      {tab === 'details' && <DetailsTab course={course} onSaved={reload} />}
      {tab === 'curriculum' && <Curriculum courseId={course.id} onChanged={reload} />}
      {tab === 'quizzes' && <Quizzes courseId={course.id} />}
      {tab === 'assignments' && <Assignments courseId={course.id} />}
      {tab === 'students' && <Students courseId={course.id} />}
      {tab === 'announcements' && <CourseAnnouncementsTab courseId={course.id} />}
    </>
  )
}

function DetailsTab({ course, onSaved }) {
  const { isAdmin } = useAuth()
  const { t } = useI18n()
  const { data: categories } = useCategories()
  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle || '',
    category_id: course.category_id || '',
    level: course.level,
    language: course.language,
    thumbnail_url: course.thumbnail_url || '',
    description: course.description || '',
    outcomes: course.outcomes?.length ? course.outcomes : [''],
    requirements: course.requirements?.length ? course.requirements : [''],
    featured: course.featured,
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      ...form,
      slug: slugify(form.slug || form.title),
      category_id: form.category_id || null,
      outcomes: form.outcomes.map((s) => s.trim()).filter(Boolean),
      requirements: form.requirements.map((s) => s.trim()).filter(Boolean),
    }
    if (!isAdmin) delete payload.featured
    const { error } = await supabase.from('courses').update(payload).eq('id', course.id)
    setBusy(false)
    if (error) return toast.error(error.code === '23505' ? t('teacher.editor.slugTaken') : errorMessage(error))
    toast.success(t('teacher.editor.saved'))
    onSaved()
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title={t('teacher.editor.basicInfo')} />
          <div className="space-y-5 p-5">
            <Input label={t('teacher.title')} required value={form.title} onChange={set('title')} />
            <Input label={t('teacher.editor.subtitle')} placeholder={t('teacher.editor.subtitlePlaceholder')} value={form.subtitle} onChange={set('subtitle')} />
            <div className="grid gap-5 sm:grid-cols-3">
              <Select label={t('teacher.category')} value={form.category_id} onChange={set('category_id')}>
                <option value="">{t('common.none')}</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Select label={t('teacher.editor.level')} value={form.level} onChange={set('level')}>
                {LEVEL_KEYS.map((v) => (
                  <option key={v} value={v}>{levelLabel(v)}</option>
                ))}
              </Select>
              <Input label={t('teacher.editor.language')} value={form.language} onChange={set('language')} />
            </div>
            <Textarea label={t('teacher.editor.description')} rows={10} hint={t('teacher.markdownHint')} value={form.description} onChange={set('description')} />
          </div>
        </Card>
        <Card>
          <CardHeader title={t('teacher.editor.outcomesTitle')} />
          <div className="grid gap-8 p-5 md:grid-cols-2">
            <ListEditor label={t('teacher.editor.outcomes')} items={form.outcomes} onChange={(v) => setForm({ ...form, outcomes: v })} placeholder={t('teacher.editor.outcomesPlaceholder')} />
            <ListEditor label={t('courseDetail.requirements')} items={form.requirements} onChange={(v) => setForm({ ...form, requirements: v })} placeholder={t('teacher.editor.requirementsPlaceholder')} />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader title={t('teacher.editor.thumbnail')} description={t('teacher.editor.thumbnailHint')} />
          <div className="p-5">
            <ImageUpload value={form.thumbnail_url} onChange={(v) => setForm({ ...form, thumbnail_url: v })} folder="courses" />
          </div>
        </Card>
        <Card>
          <CardHeader title={t('teacher.editor.settings')} />
          <div className="space-y-5 p-5">
            <Input label={t('teacher.slug')} dir="ltr" value={form.slug} onChange={set('slug')} hint={<span dir="ltr">{`skillriseacademy.org/courses/${slugify(form.slug || form.title)}`}</span>} />
            {isAdmin && <Checkbox label={t('teacher.editor.featured')} description={t('teacher.editor.featuredHint')} checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />}
          </div>
        </Card>
        <Button type="submit" loading={busy} size="lg" className="w-full">{t('common.saveChanges')}</Button>
      </div>
    </form>
  )
}
