import { useState } from 'react'
import toast from 'react-hot-toast'
import { CircleCheck, Mail, MapPin, Phone } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/utils'
import { Button, Input, Textarea } from '../../components/ui'
import { PageHero } from './About'

export default function Contact() {
  const { settings } = useSettings()
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
      <PageHero eyebrow="Contact" title="We'd love to hear from you" description="Questions about courses, partnerships, volunteering or donations? Send us a message and our team will reply soon." />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            settings.contact_email && { icon: Mail, label: 'Email', value: settings.contact_email, href: `mailto:${settings.contact_email}` },
            settings.contact_phone && { icon: Phone, label: 'Phone', value: settings.contact_phone, href: `tel:${settings.contact_phone}` },
            settings.address && { icon: MapPin, label: 'Address', value: settings.address },
          ]
            .filter(Boolean)
            .map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{c.label}</p>
                  {c.href ? <a href={c.href} className="font-semibold text-slate-900 hover:text-brand-700">{c.value}</a> : <p className="font-semibold text-slate-900">{c.value}</p>}
                </div>
              </div>
            ))}
        </div>
        <div className="rounded-2xl border border-slate-200 p-6 shadow-card sm:p-8 lg:col-span-2">
          {sent ? (
            <div className="py-12 text-center">
              <CircleCheck className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold">Message sent</h2>
              <p className="mt-2 text-slate-600">Thank you for reaching out. We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              <Input label="Full name" required value={form.name} onChange={set('name')} />
              <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
              <Input label="Subject" className="sm:col-span-2" value={form.subject} onChange={set('subject')} />
              <Textarea label="Message" rows={6} required className="sm:col-span-2" value={form.message} onChange={set('message')} />
              <div className="sm:col-span-2">
                <Button type="submit" loading={busy} size="lg">Send message</Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
