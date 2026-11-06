import { useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, slugify } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryIcon, categoryColor, useConfirm } from '../../components/shared'
import { Button, Card, EmptyState, Input, Modal, PageHeader, PageLoader, Textarea } from '../../components/ui'

export default function AdminCategories() {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [modal, setModal] = useState(null)
  const { data, loading, reload } = useQuery(async () => unwrap(await supabase.from('categories').select('*, courses(count)').order('sort_order')), [])

  const remove = async (c) => {
    if (!(await confirm({ title: t('admin.cats.deleteTitle'), message: t('admin.cats.deleteMessage', { name: c.name }), danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title={t('portalNav.categories')} description={t('admin.cats.description')} actions={<Button onClick={() => setModal({})}><Plus className="h-4 w-4" /> {t('admin.cats.new')}</Button>} />
      {data.length === 0 ? (
        <EmptyState icon={Tags} title={t('admin.cats.empty')} action={<Button onClick={() => setModal({})}>{t('admin.cats.create')}</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const col = categoryColor(c.color)
            return (
              <Card key={c.id} className="flex items-start gap-4 p-5">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', col.bg, col.text)}>
                  <CategoryIcon name={c.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500"><span dir="ltr">/{c.slug}</span> · {t('admin.cats.courseCount', { count: c.courses?.[0]?.count || 0 })} · {t('admin.cats.order', { n: c.sort_order })}</p>
                  {c.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>}
                </div>
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" onClick={() => setModal(c)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => remove(c)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <CategoryModal state={modal} nextOrder={data.length + 1} onClose={() => setModal(null)} onSaved={reload} />
    </>
  )
}

function CategoryModal({ state, nextOrder, onClose, onSaved }) {
  const { t } = useI18n()
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  if (state !== last) {
    setLast(state)
    setForm({ name: state?.name || '', slug: state?.slug || '', description: state?.description || '', icon: state?.icon || 'BookOpen', color: state?.color || 'blue', sort_order: state?.sort_order ?? nextOrder })
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = { ...form, slug: slugify(form.slug || form.name), sort_order: parseInt(form.sort_order, 10) || 0 }
    const { error } = state.id ? await supabase.from('categories').update(payload).eq('id', state.id) : await supabase.from('categories').insert(payload)
    setBusy(false)
    if (error) return toast.error(error.code === '23505' ? t('teacher.editor.slugTaken') : errorMessage(error))
    onClose()
    onSaved()
  }

  return (
    <Modal open={!!state} onClose={onClose} size="lg" title={state?.id ? t('admin.cats.edit') : t('admin.cats.new')} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="category-form" loading={busy}>{t('common.save')}</Button></>}>
      <form id="category-form" onSubmit={save} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={t('admin.cats.name')} required className="sm:col-span-2" value={form.name} onChange={set('name')} />
          <Input label={t('admin.cats.sortOrder')} type="number" value={form.sort_order} onChange={set('sort_order')} />
        </div>
        <Input label={t('admin.cats.slug')} dir="ltr" value={form.slug} onChange={set('slug')} hint={<>{t('admin.cats.slugHint')} <span dir="ltr">{`/courses?category=${slugify(form.slug || form.name || '')}`}</span></>} />
        <Textarea label={t('teacher.editor.description')} rows={2} value={form.description} onChange={set('description')} />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.cats.icon')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_ICONS).map((name) => (
              <button type="button" key={name} onClick={() => setForm({ ...form, icon: name })} className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', form.icon === name ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50')} title={name}>
                <CategoryIcon name={name} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.cats.color')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_COLORS).map(([name, c]) => (
              <button type="button" key={name} onClick={() => setForm({ ...form, color: name })} className={cn('h-8 w-8 rounded-full bg-gradient-to-br ring-offset-2', c.grad, form.color === name && 'ring-2 ring-slate-900')} title={name} aria-label={name} />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
