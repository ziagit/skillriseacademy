import { useState } from 'react'
import toast from 'react-hot-toast'
import { CircleCheck, Mail, MapPin, Phone } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/utils'
import { Button, Input, Textarea } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { PageHero } from './About'

export default function Contact() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('contact_messages').insert(form)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    setSent(true)
  }

  return (
    <>
      <PageHero eyebrow={t('nav.contact')} title={t('contact.title')} description={t('contact.description')} />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            settings.contact_email && { icon: Mail, label: t('contact.email'), value: settings.contact_email, href: `mailto:${settings.contact_email}`, ltr: true },
            settings.contact_phone && { icon: Phone, label: t('contact.phone'), value: settings.contact_phone, href: `tel:${settings.contact_phone}`, ltr: true },
            settings.address && { icon: MapPin, label: t('contact.address'), value: settings.address },
          ]
            .filter(Boolean)
            .map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{c.label}</p>
                  {c.href ? <a href={c.href} dir={c.ltr ? 'ltr' : undefined} className="font-semibold text-slate-900 hover:text-brand-700">{c.value}</a> : <p className="font-semibold text-slate-900">{c.value}</p>}
                </div>
              </div>
            ))}
        </div>
        <div className="rounded-2xl border border-slate-200 p-6 shadow-card sm:p-8 lg:col-span-2">
          {sent ? (
            <div className="py-12 text-center">
              <CircleCheck className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold">{t('contact.sent')}</h2>
              <p className="mt-2 text-slate-600">{t('contact.sentText')}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              <Input label={t('contact.fullName')} required value={form.name} onChange={set('name')} />
              <Input label={t('contact.email')} type="email" dir="ltr" required value={form.email} onChange={set('email')} />
              <Input label={t('contact.subject')} className="sm:col-span-2" value={form.subject} onChange={set('subject')} />
              <Textarea label={t('contact.message')} rows={6} required className="sm:col-span-2" value={form.message} onChange={set('message')} />
              <div className="sm:col-span-2">
                <Button type="submit" loading={busy} size="lg">{t('contact.send')}</Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
