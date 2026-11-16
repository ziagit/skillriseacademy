import { ArrowRight, Eye, Globe2, HandHeart, Lightbulb, Scale, Target, Users } from 'lucide-react'
import { Button } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-brand-50/70">
      <div className="absolute -end-24 -top-24 hidden h-80 w-80 rounded-full bg-brand-100 md:block" />
      <div className="absolute -bottom-28 -start-20 hidden h-64 w-64 rounded-full bg-brand-100/70 md:block" />
      <div className="container-page relative py-14 text-center sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mx-auto mt-2 max-w-3xl text-4xl font-semibold sm:text-[44px] sm:leading-tight">{title}</h1>
        {description && <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{description}</p>}
        {children}
      </div>
    </section>
  )
}

export default function About() {
  const { t } = useI18n()
  const values = [
    { icon: HandHeart, title: t('about.v1Title'), text: t('about.v1Text') },
    { icon: Target, title: t('about.v2Title'), text: t('about.v2Text') },
    { icon: Scale, title: t('about.v3Title'), text: t('about.v3Text') },
    { icon: Lightbulb, title: t('about.v4Title'), text: t('about.v4Text') },
  ]
  return (
    <>
      <PageHero
        eyebrow={t('about.eyebrow')}
        title={t('about.title')}
        description={t('about.description')}
      />

      <section className="container-page grid gap-12 py-20 lg:grid-cols-2">
        <div className="space-y-5 text-lg leading-relaxed text-slate-600">
          <h2 className="text-3xl font-semibold text-slate-900">{t('about.story')}</h2>
          <p>{t('about.story1')}</p>
          <p>{t('about.story2')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-600 p-7 text-white">
            <Target className="h-7 w-7 text-amber-300" />
            <h3 className="mt-4 text-xl font-bold text-white">{t('about.mission')}</h3>
            <p className="mt-2 text-brand-100">{t('about.missionText')}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-7 text-white">
            <Eye className="h-7 w-7 text-amber-300" />
            <h3 className="mt-4 text-xl font-bold text-white">{t('about.vision')}</h3>
            <p className="mt-2 text-slate-300">{t('about.visionText')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-7 sm:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Globe2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{t('about.global')}</h3>
                <p className="text-sm text-slate-600">{t('about.globalText')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t('about.valuesEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-semibold">{t('about.valuesTitle')}</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <v.icon className="h-7 w-7 text-brand-600" />
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-8">
            <Users className="h-8 w-8 text-brand-600" />
            <h3 className="mt-4 text-2xl font-semibold">{t('about.teach')}</h3>
            <p className="mt-2 text-slate-600">{t('about.teachText')}</p>
            <Button to="/teach" className="mt-6">{t('home.teach.cta')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>
          </div>
          <div className="rounded-xl bg-amber-50 p-8 ring-1 ring-amber-200">
            <HandHeart className="h-8 w-8 text-amber-600" />
            <h3 className="mt-4 text-2xl font-semibold">{t('about.fund')}</h3>
            <p className="mt-2 text-slate-700">{t('about.fundText')}</p>
            <Button to="/donate" variant="accent" className="mt-6">{t('about.donateNow')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>
          </div>
        </div>
      </section>
    </>
  )
}
