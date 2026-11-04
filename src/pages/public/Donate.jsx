import { BookOpen, Building2, Copy, ExternalLink, GraduationCap, Heart, Server, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings } from '../../context/SettingsContext'
import { Button } from '../../components/ui'
import { PageHero } from './About'

export default function Donate() {
  const { settings } = useSettings()
  const impact = [
    { icon: Server, title: 'Keep the platform running', text: 'Hosting, video delivery and security for thousands of learners.' },
    { icon: BookOpen, title: 'Create new courses', text: 'Support teachers to produce high-quality lessons in new skill areas.' },
    { icon: Users, title: 'Reach more learners', text: 'Outreach to communities that need free education the most.' },
    { icon: GraduationCap, title: 'Fund certificates & mentoring', text: 'Help learners turn skills into jobs and freelance income.' },
  ]

  return (
    <>
      <PageHero
        eyebrow="Support our mission"
        title="Your gift keeps learning free"
        description="SkillRise Academy is a non-profit. Every course is free because donors like you believe everyone deserves the chance to learn."
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold">Where your donation goes</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {impact.map((i) => (
              <div key={i.title} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <i.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{i.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{i.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Other ways to give</p>
            <p className="mt-1">
              Volunteer as a teacher, sponsor a course, or partner with us as an organization. <a href="/contact" className="font-semibold text-brand-600 hover:underline">Get in touch</a>.
            </p>
          </div>
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-7 text-white">
              <Heart className="h-8 w-8" fill="currentColor" />
              <h3 className="mt-4 text-2xl font-bold text-white">Make a donation</h3>
              <p className="mt-1 text-rose-100">Every amount helps a learner rise.</p>
            </div>
            <div className="space-y-6 p-7">
              {settings.donate_url ? (
                <Button href={settings.donate_url} target="_blank" rel="noreferrer" size="lg" className="w-full bg-rose-600 hover:bg-rose-700">
                  Donate securely <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                !settings.donate_bank_details && <p className="text-sm text-slate-500">Online donations are coming soon. Please contact us to give today.</p>
              )}
              {settings.donate_bank_details && (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Building2 className="h-4 w-4" /> Bank transfer
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-700 ring-1 ring-slate-200">{settings.donate_bank_details}</pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigator.clipboard.writeText(settings.donate_bank_details).then(() => toast.success('Copied'))}
                  >
                    <Copy className="h-4 w-4" /> Copy details
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Questions about donating? Email <a href={`mailto:${settings.contact_email}`} className="font-medium text-brand-600">{settings.contact_email}</a>
              </p>
            </div>
          </div>
        </aside>
      </section>
    </>
  )
}
