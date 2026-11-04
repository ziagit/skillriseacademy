import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { unwrap, useQuery } from '../../../lib/useQuery'
import { errorMessage, formatDateTime } from '../../../lib/utils'
import { useConfirm } from '../../../components/shared'
import { Button, Card, CardHeader, EmptyState, Input, PageLoader, Textarea } from '../../../components/ui'

// Shared by course editor (courseId set) and admin site-wide announcements (courseId null).
export function AnnouncementComposer({ courseId = null, description }) {
  const { user } = useAuth()
  const confirm = useConfirm()
  const [form, setForm] = useState({ title: '', body: '' })
  const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useQuery(async () => {
    let q = supabase.from('announcements').select('*, author:profiles!announcements_author_id_fkey(full_name)').order('created_at', { ascending: false })
    q = courseId ? q.eq('course_id', courseId) : q.is('course_id', null)
    return unwrap(await q)
  }, [courseId])

  const post = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('announcements').insert({ ...form, course_id: courseId, author_id: user.id })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success('Announcement posted')
    setForm({ title: '', body: '' })
    reload()
  }

  const remove = async (a) => {
    if (!(await confirm({ title: 'Delete announcement?', message: a.title, danger: true, confirmLabel: 'Delete' }))) return
    const { error } = await supabase.from('announcements').delete().eq('id', a.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="h-fit lg:col-span-2">
        <CardHeader title="New announcement" description={description} />
        <form onSubmit={post} className="space-y-4 p-5">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Message" required rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <Button type="submit" loading={busy}>Post announcement</Button>
        </form>
      </Card>
      <div className="space-y-4 lg:col-span-3">
        {loading ? (
          <PageLoader />
        ) : data.length === 0 ? (
          <EmptyState icon={Bell} title="No announcements yet" />
        ) : (
          data.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">{a.author?.full_name} · {formatDateTime(a.created_at)}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{a.title}</h3>
                </div>
                <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => remove(a)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{a.body}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default function CourseAnnouncementsTab({ courseId }) {
  return <AnnouncementComposer courseId={courseId} description="Visible to everyone enrolled in this course." />
}
