import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSettings } from '../../context/SettingsContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { Button, Card, CardHeader, Input, PageHeader, PageLoader, Textarea } from '../../components/ui'

// Labels are translation keys under admin.settings.
const GROUPS = [
  {
    id: 'organization',
    fields: [
      ['site_name'],
      ['tagline'],
      ['contact_email', 'email'],
      ['contact_phone'],
      ['address', 'textarea'],
    ],
  },
  {
    id: 'donations',
    fields: [
      ['donate_url', 'url'],
      ['donate_bank_details', 'textarea'],
    ],
  },
  {
    id: 'social',
    fields: [
      ['facebook_url', 'url'],
      ['instagram_url', 'url'],
      ['youtube_url', 'url'],
      ['linkedin_url', 'url'],
      ['x_url', 'url'],
      ['whatsapp_url', 'url'],
    ],
  },
  {
    id: 'homepage',
    fields: [
      ['partners', 'textarea'],
      ['testimonials', 'textarea'],
    ],
  },
]
const LTR_TYPES = ['email', 'url']

export default function AdminSettings() {
  const { reload: reloadSettings } = useSettings()
  const { t } = useI18n()
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const { loading } = useQuery(async () => {
    const rows = unwrap(await supabase.from('site_settings').select('key, value'))
    setForm(Object.fromEntries(rows.map((r) => [r.key, r.value || ''])))
  }, [])

  if (loading || !form) return <PageLoader />

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const rows = GROUPS.flatMap((g) => g.fields.map(([key]) => ({ key, value: form[key]?.trim() || '', updated_at: new Date().toISOString() })))
    const { error } = await supabase.from('site_settings').upsert(rows)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('admin.settings.saved'))
    reloadSettings()
  }

  return (
    <form onSubmit={save}>
      <PageHeader title={t('portalNav.siteSettings')} description={t('admin.settings.description')} actions={<Button type="submit" loading={busy}>{t('admin.settings.save')}</Button>} />
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.id}>
            <CardHeader title={t(`admin.settings.groups.${g.id}`)} description={g.id !== 'organization' ? t(`admin.settings.groups.${g.id}Hint`) : undefined} />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {g.fields.map(([key, type]) =>
                type === 'textarea' ? (
                  <Textarea key={key} label={t(`admin.settings.fields.${key}`)} rows={4} dir="auto" className="sm:col-span-2" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                ) : (
                  <Input key={key} label={t(`admin.settings.fields.${key}`)} type={type || 'text'} dir={LTR_TYPES.includes(type) ? 'ltr' : undefined} placeholder={type === 'url' ? 'https://' : ''} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                ),
              )}
            </div>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button type="submit" loading={busy} size="lg">{t('admin.settings.save')}</Button>
        </div>
      </div>
    </form>
  )
}
