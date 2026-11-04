import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSettings } from '../../context/SettingsContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage } from '../../lib/utils'
import { Button, Card, CardHeader, Input, PageHeader, PageLoader, Textarea } from '../../components/ui'

const GROUPS = [
  {
    title: 'Organization',
    fields: [
      ['site_name', 'Organization name'],
      ['tagline', 'Tagline'],
      ['contact_email', 'Contact email', 'email'],
      ['contact_phone', 'Contact phone'],
      ['address', 'Address', 'textarea'],
    ],
  },
  {
    title: 'Donations',
    description: 'Shown on the Donate page. Use a link to your payment provider (e.g. PayPal, Stripe Payment Link, GoFundMe) and/or bank details.',
    fields: [
      ['donate_url', 'Online donation link', 'url'],
      ['donate_bank_details', 'Bank transfer details', 'textarea'],
    ],
  },
  {
    title: 'Social media',
    description: 'Leave blank to hide an icon in the footer.',
    fields: [
      ['facebook_url', 'Facebook', 'url'],
      ['instagram_url', 'Instagram', 'url'],
      ['youtube_url', 'YouTube', 'url'],
      ['linkedin_url', 'LinkedIn', 'url'],
      ['x_url', 'X (Twitter)', 'url'],
      ['whatsapp_url', 'WhatsApp link', 'url'],
    ],
  },
]

export default function AdminSettings() {
  const { reload: reloadSettings } = useSettings()
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
    toast.success('Settings saved')
    reloadSettings()
  }

  return (
    <form onSubmit={save}>
      <PageHeader title="Site settings" description="Contact details, donation options and social links shown across the website." actions={<Button type="submit" loading={busy}>Save settings</Button>} />
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.title}>
            <CardHeader title={g.title} description={g.description} />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {g.fields.map(([key, label, type]) =>
                type === 'textarea' ? (
                  <Textarea key={key} label={label} rows={4} className="sm:col-span-2" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                ) : (
                  <Input key={key} label={label} type={type || 'text'} placeholder={type === 'url' ? 'https://' : ''} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                ),
              )}
            </div>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button type="submit" loading={busy} size="lg">Save settings</Button>
        </div>
      </div>
    </form>
  )
}
