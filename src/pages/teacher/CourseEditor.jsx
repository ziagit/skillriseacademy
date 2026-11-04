import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Bell, ClipboardList, Eye, FileText, Layers, ListChecks, Send, Trash2, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, LEVELS, slugify } from '../../lib/utils'
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
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'details'
  const { data: course, loading, reload } = useQuery(async () => unwrap(await supabase.from('courses').select('*, lessons(count)').eq('id', id).maybeSingle()), [id])

  if (loading) return <PageLoader />
  if (!course) return <EmptyState title="Course not found" action={<Button to="/teacher/courses">Back to my courses</Button>} />

  const setStatus = async (status, message) => {
    const { error } = await supabase.from('courses').update({ status }).eq('id', course.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  const submitForReview = async () => {
    if (!course.lessons?.[0]?.count) return toast.error('Add at least one lesson before submitting')
    if (await confirm({ title: 'Submit for review?', message: 'Our team will review your course and publish it. You can keep editing while it is in review.', confirmLabel: 'Submit' })) {
      setStatus('pending', 'Submitted for review')
    }
  }

  const remove = async () => {
    if (!(await confirm({ title: 'Delete this course?', message: 'This permanently deletes the course with all lessons, quizzes and assignments.', danger: true, confirmLabel: 'Delete course' }))) return
    const { error } = await supabase.from('courses').delete().eq('id', course.id)
    if (error) return toast.error(errorMessage(error))
    toast.success('Course deleted')
    navigate('/teacher/courses')
  }

  return (
    <>
      <div className="mb-6">
        <Link to={isAdmin ? '/admin/courses' : '/teacher/courses'} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> {isAdmin ? 'All courses' : 'My courses'}
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-bold">{course.title}</h1>
              <StatusBadge status={course.status} />
            </div>
            {course.review_note && course.status === 'draft' && <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Reviewer note: {course.review_note}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to={`/courses/${course.slug}`} variant="secondary" size="sm"><Eye className="h-4 w-4" /> Preview</Button>
            {isAdmin ? (
              course.status !== 'published' ? (
                <Button size="sm" onClick={() => setStatus('published', 'Course published')}><Send className="h-4 w-4" /> Publish</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setStatus('draft', 'Course unpublished')}>Unpublish</Button>
              )
            ) : course.status === 'draft' ? (
              <Button size="sm" onClick={submitForReview}><Send className="h-4 w-4" /> Submit for review</Button>
            ) : course.status === 'pending' ? (
              <Button size="sm" variant="secondary" onClick={() => setStatus('draft', 'Moved back to draft')}>Withdraw from review</Button>
            ) : null}
            {(isAdmin || course.status === 'draft') && (
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={remove} aria-label="Delete course"><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        tabs={[
          { value: 'details', label: 'Details', icon: FileText },
          { value: 'curriculum', label: 'Curriculum', icon: Layers },
          { value: 'quizzes', label: 'Quizzes', icon: ListChecks },
          { value: 'assignments', label: 'Assignments', icon: ClipboardList },
          { value: 'students', label: 'Students', icon: Users },
          { value: 'announcements', label: 'Announcements', icon: Bell },
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
    if (error) return toast.error(error.code === '23505' ? 'That URL slug is already taken' : errorMessage(error))
    toast.success('Course saved')
    onSaved()
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title="Basic information" />
          <div className="space-y-5 p-5">
            <Input label="Title" required value={form.title} onChange={set('title')} />
            <Input label="Subtitle" placeholder="A one-line summary shown on course cards" value={form.subtitle} onChange={set('subtitle')} />
            <div className="grid gap-5 sm:grid-cols-3">
              <Select label="Category" value={form.category_id} onChange={set('category_id')}>
                <option value="">None</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Select label="Level" value={form.level} onChange={set('level')}>
                {Object.entries(LEVELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
              <Input label="Language" value={form.language} onChange={set('language')} />
            </div>
            <Textarea label="Description" rows={10} hint="Markdown supported: **bold**, lists, links and headings." value={form.description} onChange={set('description')} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Outcomes & requirements" />
          <div className="grid gap-8 p-5 md:grid-cols-2">
            <ListEditor label="What learners will learn" items={form.outcomes} onChange={(v) => setForm({ ...form, outcomes: v })} placeholder="e.g. Design a logo from scratch" />
            <ListEditor label="Requirements" items={form.requirements} onChange={(v) => setForm({ ...form, requirements: v })} placeholder="e.g. A computer with internet" />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader title="Thumbnail" description="16:9, at least 1280×720." />
          <div className="p-5">
            <ImageUpload value={form.thumbnail_url} onChange={(v) => setForm({ ...form, thumbnail_url: v })} folder="courses" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Settings" />
          <div className="space-y-5 p-5">
            <Input label="URL slug" value={form.slug} onChange={set('slug')} hint={`skillriseacademy.org/courses/${slugify(form.slug || form.title)}`} />
            {isAdmin && <Checkbox label="Featured course" description="Show on the home page." checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />}
          </div>
        </Card>
        <Button type="submit" loading={busy} size="lg" className="w-full">Save changes</Button>
      </div>
    </form>
  )
}
