import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Archive, BookOpen, Eye, Pencil, Send, Star, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, timeAgo } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CourseThumbnail } from '../../components/shared'
import { Button, Card, EmptyState, Modal, PageHeader, PageLoader, SearchInput, StatusBadge, Tabs, Textarea } from '../../components/ui'

export default function AdminCourses() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('courses').select('id, title, slug, status, featured, thumbnail_url, updated_at, category:categories(name, icon, color), teacher:profiles!courses_teacher_id_fkey(full_name), enrollments(count), lessons(count)').order('updated_at', { ascending: false })),
    [],
  )

  const list = useMemo(() => {
    const q = search.toLowerCase()
    return (data || []).filter((c) => (status === 'all' || c.status === status) && (!q || c.title.toLowerCase().includes(q) || c.teacher?.full_name?.toLowerCase().includes(q)))
  }, [data, status, search])

  const update = async (c, patch, message) => {
    const { error } = await supabase.from('courses').update(patch).eq('id', c.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  if (loading) return <PageLoader />
  const count = (s) => data.filter((c) => c.status === s).length

  return (
    <>
      <PageHeader title={t('portalNav.courses')} description={t('admin.courses.description')} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          value={status}
          onChange={(s) => setParams(s === 'all' ? {} : { status: s })}
          tabs={[
            { value: 'all', label: t('common.all'), count: t('common.number', { n: data.length }) },
            { value: 'pending', label: t('status.pending'), count: t('common.number', { n: count('pending') }) },
            { value: 'published', label: t('status.published'), count: t('common.number', { n: count('published') }) },
            { value: 'draft', label: t('admin.drafts'), count: t('common.number', { n: count('draft') }) },
            { value: 'archived', label: t('status.archived'), count: t('common.number', { n: count('archived') }) },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder={t('admin.courses.search')} className="sm:w-72" />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('admin.courses.empty')} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('admin.courses.course')}</th>
                  <th>{t('roles.teacher')}</th>
                  <th>{t('player.tabLessons')}</th>
                  <th>{t('admin.courses.learners')}</th>
                  <th>{t('studentsTab.status')}</th>
                  <th className="text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <CourseThumbnail course={c} className="!w-20 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <p dir="auto" className="max-w-xs truncate font-medium text-slate-900">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.category?.name || t('teacher.uncategorized')} · {timeAgo(c.updated_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{c.teacher?.full_name}</td>
                    <td>{t('common.number', { n: c.lessons?.[0]?.count || 0 })}</td>
                    <td>{t('common.number', { n: c.enrollments?.[0]?.count || 0 })}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title={c.featured ? t('admin.courses.unfeature') : t('admin.courses.feature')} onClick={() => update(c, { featured: !c.featured }, c.featured ? t('admin.courses.unfeatured') : t('admin.courses.featured'))}>
                          <Star className={cn('h-4 w-4', c.featured && 'fill-amber-400 text-amber-500')} />
                        </Button>
                        <Button variant="ghost" size="icon" to={`/courses/${c.slug}`} title={t('courseDetail.preview')}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" to={`/teacher/courses/${c.id}`} title={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                        {c.status !== 'published' && c.status !== 'archived' && (
                          <Button size="sm" onClick={() => update(c, { status: 'published', review_note: null }, t('teacher.editor.published'))}><Send className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t('teacher.editor.publish')}</Button>
                        )}
                        {c.status === 'pending' && <Button size="sm" variant="secondary" onClick={() => setRejecting(c)}><Undo2 className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t('admin.return')}</Button>}
                        {c.status === 'published' && <Button size="sm" variant="secondary" onClick={() => update(c, { status: 'archived' }, t('admin.courses.archived'))}><Archive className="h-3.5 w-3.5" /> {t('admin.archive')}</Button>}
                        {c.status === 'archived' && <Button size="sm" variant="secondary" onClick={() => update(c, { status: 'published' }, t('admin.courses.restored'))}>{t('admin.restore')}</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <ReturnModal item={rejecting} table="courses" onClose={() => setRejecting(null)} onDone={reload} />
    </>
  )
}

// Sends content back to draft with a note for the author.
export function ReturnModal({ item, table, onClose, onDone }) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    const { error } = await supabase.from(table).update({ status: 'draft', review_note: note || null }).eq('id', item.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('admin.returnModal.done'))
    setNote('')
    onClose()
    onDone()
  }
  return (
    <Modal open={!!item} onClose={onClose} title={t('subs.returnForChanges')} description={item?.title} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={submit} loading={busy}>{t('admin.returnModal.submit')}</Button></>}>
      <Textarea label={t('admin.returnModal.note')} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('admin.returnModal.placeholder')} />
    </Modal>
  )
}
