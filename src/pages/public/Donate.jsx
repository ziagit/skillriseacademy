import { BookOpen, Building2, Copy, ExternalLink, GraduationCap, Heart, Server, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings } from '../../context/SettingsContext'
import { Button } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { PageHero } from './About'

export default function Donate() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const impact = [
    { icon: Server, title: t('donate.i1Title'), text: t('donate.i1Text') },
    { icon: BookOpen, title: t('donate.i2Title'), text: t('donate.i2Text') },
    { icon: Users, title: t('donate.i3Title'), text: t('donate.i3Text') },
    { icon: GraduationCap, title: t('donate.i4Title'), text: t('donate.i4Text') },
  ]

  return (
    <>
      <PageHero
        eyebrow={t('footer.support')}
        title={t('donate.title')}
        description={t('donate.description')}
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold">{t('donate.where')}</h2>
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
            <p className="font-semibold text-slate-900">{t('donate.otherWays')}</p>
            <p className="mt-1">
              {t('donate.otherWaysText')} <a href="/contact" className="font-semibold text-brand-600 hover:underline">{t('footer.getInTouch')}</a>{t('home.faq.period')}
            </p>
          </div>
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-7 text-white">
              <Heart className="h-8 w-8" fill="currentColor" />
              <h3 className="mt-4 text-2xl font-bold text-white">{t('donate.make')}</h3>
              <p className="mt-1 text-rose-100">{t('donate.everyAmount')}</p>
            </div>
            <div className="space-y-6 p-7">
              {settings.donate_url ? (
                <Button href={settings.donate_url} target="_blank" rel="noreferrer" size="lg" className="w-full bg-rose-600 hover:bg-rose-700">
                  {t('donate.secure')} <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                !settings.donate_bank_details && <p className="text-sm text-slate-500">{t('donate.comingSoon')}</p>
              )}
              {settings.donate_bank_details && (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Building2 className="h-4 w-4" /> {t('donate.bank')}
                  </p>
                  <pre dir="auto" className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-slate-700 ring-1 ring-slate-200">{settings.donate_bank_details}</pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigator.clipboard.writeText(settings.donate_bank_details).then(() => toast.success(t('common.copied')))}
                  >
                    <Copy className="h-4 w-4" /> {t('donate.copy')}
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {t('donate.questions')} <a href={`mailto:${settings.contact_email}`} dir="ltr" className="font-medium text-brand-600">{settings.contact_email}</a>
              </p>
            </div>
          </div>
        </aside>
      </section>
    </>
  )
}
