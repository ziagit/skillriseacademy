import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, CircleHelp, CirclePlay, ExternalLink, Eye, EyeOff, GraduationCap, Images, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { SLIDE_ARTS, SLIDE_THEMES } from '../../lib/constants'
import { cn, errorMessage, toYouTubeEmbedUrl, toYouTubeThumbnailUrl } from '../../lib/utils'
import { LANGUAGES, useI18n } from '../../lib/i18n'
import { ImageUpload, useConfirm } from '../../components/shared'
import { Avatar, Badge, Button, Card, Checkbox, EmptyState, Input, Modal, PageHeader, PageLoader, Select, Tabs, Textarea } from '../../components/ui'

const LANG_FIELD = { key: 'lang', type: 'lang' }
const ORDER_FIELD = { key: 'sort_order', type: 'number' }

// Each tab edits one table. Field labels are translation keys under admin.home.fields.
const CONTENT = {
  slides: {
    table: 'home_slides',
    icon: Images,
    defaults: { theme: 'blue', art: 'certificate', audience: 'all' },
    fields: [
      { key: 'title', required: true, hint: true, span: 3 },
      { key: 'eyebrow', span: 3 },
      { key: 'body', type: 'textarea', span: 3 },
      { key: 'cta_label' },
      { key: 'cta_url', type: 'url', span: 2 },
      { key: 'cta2_label' },
      { key: 'cta2_url', type: 'url', span: 2 },
      { key: 'theme', type: 'theme', span: 3 },
      { key: 'art', type: 'select', options: SLIDE_ARTS },
      { key: 'audience', type: 'select', options: ['all', 'guests', 'members'] },
      LANG_FIELD,
      { key: 'image_url', type: 'image', hint: true, span: 2 },
      ORDER_FIELD,
    ],
    Row: SlideRow,
  },
  partners: {
    table: 'partners',
    icon: Building2,
    fields: [
      { key: 'name', required: true, span: 2 },
      ORDER_FIELD,
      { key: 'website_url', type: 'url', span: 3 },
      { key: 'logo_url', type: 'image', square: true },
    ],
    Row: PartnerRow,
  },
  reviews: {
    table: 'testimonials',
    icon: MessageSquareQuote,
    defaults: { rating: 5 },
    fields: [
      { key: 'name', required: true },
      { key: 'role', span: 2 },
      { key: 'quote', type: 'textarea', required: true, span: 3 },
      { key: 'rating', type: 'select', options: [5, 4, 3, 2, 1], plain: true },
      LANG_FIELD,
      ORDER_FIELD,
      { key: 'photo_url', type: 'image', square: true },
    ],
    Row: ReviewRow,
  },
  faqs: {
    table: 'faqs',
    icon: CircleHelp,
    fields: [
      { key: 'question', required: true, span: 3 },
      { key: 'answer', type: 'textarea', required: true, span: 3 },
      LANG_FIELD,
      ORDER_FIELD,
    ],
    Row: FaqRow,
  },
}
const VIDEO_CONTENT = {
  table: 'home_videos',
  icon: CirclePlay,
  fields: [
    { key: 'title', required: true, span: 3 },
    { key: 'youtube_url', type: 'url', required: true, hint: true, span: 3 },
    { key: 'channel', span: 2 },
    { key: 'thumbnail_url', type: 'image', hint: true, span: 3 },
    ORDER_FIELD,
  ],
  Row: VideoRow,
}
const TABS = [...Object.keys(CONTENT), 'teachers']

export default function AdminHomepage() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'slides'
  return (
    <>
      <PageHeader
        title={t('portalNav.homepage')}
        description={t('admin.home.description')}
        actions={<Button href="/" target="_blank" rel="noreferrer" variant="outline"><ExternalLink className="h-4 w-4" /> {t('admin.home.view')}</Button>}
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        tabs={TABS.map((v) => ({ value: v, label: t(`admin.home.tabs.${v}`), icon: CONTENT[v]?.icon || GraduationCap }))}
      />
      {tab === 'teachers' ? <TeachersTab /> : <ContentTab key={tab} tab={tab} {...CONTENT[tab]} />}
    </>
  )
}

export function AdminVideos() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader
        title={t('portalNav.youtubeVideos')}
        description={t('admin.home.hints.videos')}
        actions={<Button href="/" target="_blank" rel="noreferrer" variant="outline"><ExternalLink className="h-4 w-4" /> {t('admin.home.view')}</Button>}
      />
      <ContentTab key="videos" tab="videos" showHint={false} {...VIDEO_CONTENT} />
    </>
  )
}

function ContentTab({ tab, table, icon: Icon, defaults, fields, Row, showHint = true }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [modal, setModal] = useState(null)
  const { data, loading, error, reload } = useQuery(
    async () => unwrap(await supabase.from(table).select('*').order('sort_order').order('created_at')),
    [table],
  )

  const togglePublished = async (item) => {
    const { error } = await supabase.from(table).update({ published: !item.published }).eq('id', item.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  const remove = async (item) => {
    if (!(await confirm({ title: t('admin.home.deleteTitle'), message: t('admin.home.deleteMessage'), danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from(table).delete().eq('id', item.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  if (error) {
    const missingVideosTable = tab === 'videos' && (error.code === 'PGRST205' || error.message?.includes('home_videos'))
    return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{missingVideosTable ? t('admin.home.videosMigrationRequired') : errorMessage(error)}</p>
  }
  const items = data || []
  const nextOrder = Math.max(0, ...items.map((d) => d.sort_order)) + 1
  const add = () => setModal({ ...defaults, sort_order: nextOrder })
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showHint && <p className="text-sm text-slate-500">{t(`admin.home.hints.${tab}`)}</p>}
        <Button onClick={add} className="shrink-0"><Plus className="h-4 w-4" /> {t(`admin.home.new.${tab}`)}</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Icon} title={t('admin.home.empty')} action={<Button onClick={add}>{t(`admin.home.new.${tab}`)}</Button>} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={cn('flex items-start gap-4 p-4', !item.published && 'bg-slate-50')}>
              <div className={cn('min-w-0 flex-1', !item.published && 'opacity-60')}>
                <Row item={item} />
                <ItemBadges item={item} />
              </div>
              <div className="flex shrink-0 flex-col sm:flex-row">
                <Button variant="ghost" size="icon" onClick={() => togglePublished(item)} title={item.published ? t('admin.home.hide') : t('admin.home.show')} aria-label={item.published ? t('admin.home.hide') : t('admin.home.show')}>
                  {item.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setModal(item)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => remove(item)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ContentModal tab={tab} table={table} fields={fields} state={modal} onClose={() => setModal(null)} onSaved={reload} />
    </>
  )
}

function ItemBadges({ item }) {
  const { t } = useI18n()
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {!item.published && <Badge tone="amber">{t('admin.home.hidden')}</Badge>}
      {'lang' in item && <Badge tone="blue">{item.lang ? LANGUAGES[item.lang].label : t('admin.home.options.lang.all')}</Badge>}
      {item.audience && item.audience !== 'all' && <Badge tone="violet">{t(`admin.home.options.audience.${item.audience}`)}</Badge>}
      <Badge>{t('admin.cats.order', { n: item.sort_order })}</Badge>
    </div>
  )
}

function ContentModal({ tab, table, fields, state, onClose, onSaved }) {
  const { t } = useI18n()
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  if (state !== last) {
    setLast(state)
    setForm(Object.fromEntries(fields.map((f) => [f.key, state?.[f.key] ?? ''])))
  }
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    if (tab === 'videos' && !toYouTubeEmbedUrl(form.youtube_url)) {
      toast.error(t('admin.home.invalidYoutubeUrl'))
      return
    }
    setBusy(true)
    const payload = Object.fromEntries(
      fields.map(({ key, type }) => {
        const value = typeof form[key] === 'string' ? form[key].trim() : form[key]
        if (type === 'number' || key === 'rating') return [key, parseInt(value, 10) || 0]
        return [key, value === '' ? null : value]
      }),
    )
    const { error } = state.id ? await supabase.from(table).update(payload).eq('id', state.id) : await supabase.from(table).insert(payload)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('admin.home.saved'))
    onClose()
    onSaved()
  }

  const formId = `${tab}-form`
  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="lg"
      title={state?.id ? t(`admin.home.edit.${tab}`) : t(`admin.home.new.${tab}`)}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form={formId} loading={busy}>{t('common.save')}</Button></>}
    >
      <form id={formId} onSubmit={save} className="grid gap-4 sm:grid-cols-3">
        {fields.map((f) => (
          <FormField key={f.key} field={f} value={form[f.key]} onChange={(v) => set(f.key, v)} />
        ))}
      </form>
    </Modal>
  )
}

function FormField({ field, value, onChange }) {
  const { t } = useI18n()
  const { key, type = 'text', required, options, span = 1 } = field
  const label = t(`admin.home.fields.${key}`)
  const hint = field.hint ? t(`admin.home.fieldHints.${key}`) : undefined
  const className = { 1: '', 2: 'sm:col-span-2', 3: 'sm:col-span-3' }[span]

  if (type === 'textarea') return <Textarea label={label} hint={hint} required={required} rows={3} dir="auto" className={className} value={value} onChange={(e) => onChange(e.target.value)} />
  if (type === 'select' || type === 'lang') {
    const opts = type === 'lang' ? ['', ...Object.keys(LANGUAGES)] : options
    const optionLabel = (o) => (field.plain ? '★'.repeat(o) : type === 'lang' ? (o ? LANGUAGES[o].label : t('admin.home.options.lang.all')) : t(`admin.home.options.${key}.${o}`))
    return (
      <Select label={label} hint={hint} className={className} value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
      </Select>
    )
  }
  if (type === 'theme') {
    return (
      <div className={className}>
        <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SLIDE_THEMES).map(([name, c]) => (
            <button type="button" key={name} onClick={() => onChange(name)} className={cn('h-8 w-8 rounded-full ring-offset-2', c.bg, value === name && 'ring-2 ring-slate-900')} title={t(`admin.home.options.theme.${name}`)} aria-label={t(`admin.home.options.theme.${name}`)} />
          ))}
        </div>
      </div>
    )
  }
  if (type === 'image') {
    return (
      <div className={cn(className, field.square && 'max-w-40')}>
        <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
        <ImageUpload value={value || ''} onChange={onChange} folder="home" aspect={field.square ? 'aspect-square' : 'aspect-video'} />
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
  return (
    <Input
      label={label}
      hint={hint}
      required={required}
      // Links accept site paths like /courses as well as full URLs, so they stay plain text inputs.
      type={type === 'url' ? 'text' : type}
      dir={type === 'url' ? 'ltr' : 'auto'}
      placeholder={type === 'url' ? t('admin.home.urlPlaceholder') : undefined}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function SlideRow({ item }) {
  const theme = SLIDE_THEMES[item.theme] || SLIDE_THEMES.blue
  return (
    <div className="flex items-start gap-4">
      <div className={cn('relative hidden h-16 w-28 shrink-0 overflow-hidden rounded-md sm:block', theme.bg)}>
        {item.image_url && <img src={item.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className={cn('absolute -bottom-6 -end-6 h-14 w-14 rounded-full', theme.a)} />
      </div>
      <div className="min-w-0">
        {item.eyebrow && <p dir="auto" className="text-xs font-semibold text-brand-600">{item.eyebrow}</p>}
        <p dir="auto" className="font-semibold text-slate-900">{item.title}</p>
        {item.body && <p dir="auto" className="mt-0.5 line-clamp-2 text-sm text-slate-600">{item.body}</p>}
        {(item.cta_label || item.cta2_label) && (
          <p className="mt-1 text-xs text-slate-500">
            {[item.cta_label && `${item.cta_label} → ${item.cta_url || '—'}`, item.cta2_label && `${item.cta2_label} → ${item.cta2_url || '—'}`].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}

function PartnerRow({ item }) {
  return (
    <div className="flex items-center gap-3">
      {item.logo_url ? (
        <img src={item.logo_url} alt="" className="h-10 w-10 shrink-0 rounded object-contain ring-1 ring-slate-200" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-600 font-bold text-white">{item.name.charAt(0)}</span>
      )}
      <div className="min-w-0">
        <p dir="auto" className="font-semibold text-slate-900">{item.name}</p>
        {item.website_url && <p dir="ltr" className="truncate text-start text-xs text-slate-500">{item.website_url}</p>}
      </div>
    </div>
  )
}

function ReviewRow({ item }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar src={item.photo_url} name={item.name} size="md" />
      <div className="min-w-0">
        <p dir="auto" className="font-semibold text-slate-900">
          {item.name} {item.role && <span className="font-normal text-slate-500">· {item.role}</span>}
        </p>
        <div className="mt-0.5 flex gap-0.5 text-amber-500">
          {Array.from({ length: item.rating }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
        </div>
        <p dir="auto" className="mt-1 line-clamp-2 text-sm text-slate-600">“{item.quote}”</p>
      </div>
    </div>
  )
}

function FaqRow({ item }) {
  return (
    <div>
      <p dir="auto" className="font-semibold text-slate-900">{item.question}</p>
      <p dir="auto" className="mt-0.5 line-clamp-2 text-sm text-slate-600">{item.answer}</p>
    </div>
  )
}

function VideoRow({ item }) {
  const thumbnail = item.thumbnail_url || toYouTubeThumbnailUrl(item.youtube_url)
  return (
    <div className="flex items-start gap-3">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="hidden aspect-video w-28 shrink-0 rounded-md object-cover sm:block" />
      ) : (
        <span className="hidden aspect-video w-28 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400 sm:flex"><CirclePlay className="h-7 w-7" /></span>
      )}
      <div className="min-w-0">
        <p dir="auto" className="font-semibold text-slate-900">{item.title}</p>
        {item.channel && <p dir="auto" className="mt-0.5 text-sm text-slate-500">{item.channel}</p>}
        <p dir="ltr" className="mt-1 truncate text-start text-xs text-slate-500">{item.youtube_url}</p>
      </div>
    </div>
  )
}

function TeachersTab() {
  const { t } = useI18n()
  const [editing, setEditing] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('profiles').select('id, full_name, avatar_url, headline, youtube_url, show_on_home, courses:courses!courses_teacher_id_fkey(status)').eq('role', 'teacher').order('full_name')),
    [],
  )

  const toggle = async (p) => {
    const { error } = await supabase.from('profiles').update({ show_on_home: !p.show_on_home }).eq('id', p.id)
    if (error) return toast.error(errorMessage(error))
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <>
      <p className="mb-4 text-sm text-slate-500">{t('admin.home.hints.teachers')}</p>
      {data.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t('admin.home.noTeachers')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => {
            const published = p.courses.filter((c) => c.status === 'published').length
            return (
              <Card key={p.id} className={cn('flex items-start gap-3 p-4', !p.show_on_home && 'bg-slate-50')}>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 w-14 overflow-hidden rounded">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] w-full bg-slate-100" />}
                  </div>
                  <p dir="auto" className="font-semibold text-slate-900">{p.full_name || '—'}</p>
                  {p.headline && <p dir="auto" className="line-clamp-2 text-sm text-slate-600">{p.headline}</p>}
                  {p.youtube_url && <p dir="ltr" className="mt-1 truncate text-xs text-slate-500">{p.youtube_url}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    {t('home.categories.courseCount', { count: published })}
                    {published === 0 && ` · ${t('admin.home.noPublished')}`}
                  </p>
                  <Checkbox className="mt-3" label={t('admin.home.showOnHome')} checked={p.show_on_home} onChange={() => toggle(p)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
              </Card>
            )
          })}
        </div>
      )}
      <TeacherModal teacher={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </>
  )
}

function TeacherModal({ teacher, onClose, onSaved }) {
  const { t } = useI18n()
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  if (teacher !== last) {
    setLast(teacher)
    setForm({ full_name: teacher?.full_name || '', headline: teacher?.headline || '', avatar_url: teacher?.avatar_url || '', youtube_url: teacher?.youtube_url || '' })
  }

  const save = async (e) => {
    e.preventDefault()
    if (form.youtube_url.trim() && !toYouTubeEmbedUrl(form.youtube_url)) {
      toast.error(t('admin.home.invalidYoutubeUrl'))
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name.trim(), headline: form.headline.trim() || null, avatar_url: form.avatar_url || null, youtube_url: form.youtube_url.trim() || null })
      .eq('id', teacher.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('admin.home.saved'))
    onClose()
    onSaved()
  }

  return (
    <Modal
      open={!!teacher}
      onClose={onClose}
      title={t('admin.home.edit.teachers')}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" form="teacher-form" loading={busy}>{t('common.save')}</Button></>}
    >
      <form id="teacher-form" onSubmit={save} className="space-y-4">
        <div className="max-w-32">
          <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.home.fields.photo_url')}</p>
          <ImageUpload value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} folder="avatars" aspect="aspect-[4/5]" />
        </div>
        <Input label={t('admin.home.fields.name')} required dir="auto" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label={t('admin.home.fields.headline')} dir="auto" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <Input label={t('admin.home.fields.youtube_url')} hint={t('admin.home.fieldHints.youtube_url')} type="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=…" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
      </form>
    </Modal>
  )
}
