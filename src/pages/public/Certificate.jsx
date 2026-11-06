import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Printer, SearchX, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { Logo } from '../../components/shared'
import { Button, PageLoader } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { PageHero } from './About'

export function VerifyCertificate() {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  return (
    <PageHero eyebrow={t('cert.verifyEyebrow')} title={t('cert.verifyTitle')} description={t('cert.verifyDescription')}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) navigate(`/certificate/${code.trim().toUpperCase()}`)
        }}
        className="mx-auto mt-8 flex max-w-md gap-2"
      >
        <input dir="ltr" className="input font-mono uppercase" placeholder="SRA-XXXXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit">
          <ShieldCheck className="h-4 w-4" /> {t('cert.verify')}
        </Button>
      </form>
    </PageHero>
  )
}

export function CertificateView() {
  const { t } = useI18n()
  const { code } = useParams()
  const { data, loading } = useQuery(async () => unwrap(await supabase.rpc('verify_certificate', { p_code: code }))?.[0] ?? null, [code])

  if (loading) return <PageLoader label={t('cert.verifying')} />
  if (!data) {
    return (
      <div className="container-page py-24 text-center">
        <SearchX className="mx-auto h-14 w-14 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold">{t('cert.notFound')}</h1>
        <p className="mt-2 text-slate-600">
          {t('cert.noMatch')} <span dir="ltr" className="font-mono font-semibold">{code}</span>{t('cert.noMatchAfter')}
        </p>
        <Button to="/verify" variant="secondary" className="mt-6">{t('cert.tryAnother')}</Button>
      </div>
    )
  }

  return (
    <div className="bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="container-page">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <BadgeCheck className="h-4 w-4" /> {t('cert.verified')}
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t('cert.print')}
          </Button>
        </div>

        <div className="print-certificate mx-auto aspect-[1.414/1] w-full max-w-5xl overflow-hidden bg-white shadow-2xl print:max-w-none print:shadow-none">
          <div className="relative flex h-full flex-col p-[4%]">
            <div className="absolute inset-[2%] border-2 border-brand-900/80" />
            <div className="absolute inset-[2.8%] border border-amber-400" />
            <div className="relative flex h-full flex-col items-center justify-between text-center">
              <div className="flex w-full items-center justify-between">
                <Logo />
                <p className="font-mono text-[clamp(8px,1.2vw,12px)] text-slate-500">{t('cert.id')} <span dir="ltr">{data.code}</span></p>
              </div>
              <div>
                <p className="text-[clamp(10px,1.4vw,14px)] font-semibold uppercase tracking-[0.35em] text-amber-600">{t('cert.ofCompletion')}</p>
                <p className="mt-[3%] text-[clamp(10px,1.4vw,15px)] text-slate-500">{t('cert.certifyThat')}</p>
                <p className="mt-[2%] font-display text-[clamp(24px,5vw,54px)] font-bold text-brand-950">{data.student_name}</p>
                <div className="mx-auto mt-[1%] h-px w-2/3 bg-slate-300" />
                <p className="mt-[3%] text-[clamp(10px,1.4vw,15px)] text-slate-500">{t('cert.completed')}</p>
                <p className="mt-[1.5%] font-display text-[clamp(16px,2.8vw,30px)] font-semibold text-slate-900">{data.course_title}</p>
              </div>
              <div className="grid w-full grid-cols-3 items-end gap-4 text-[clamp(9px,1.2vw,13px)]">
                <div>
                  <p className="font-semibold text-slate-900">{formatDate(data.issued_at, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <div className="mx-auto my-1 h-px w-3/4 bg-slate-300" />
                  <p className="text-slate-500">{t('cert.dateIssued')}</p>
                </div>
                <div className="flex justify-center">
                  <div className="flex aspect-square w-[clamp(48px,9vw,96px)] items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-inner">
                    <BadgeCheck className="h-1/2 w-1/2 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{data.teacher_name}</p>
                  <div className="mx-auto my-1 h-px w-3/4 bg-slate-300" />
                  <p className="text-slate-500">{t('cert.instructor')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="no-print mt-6 text-center text-sm text-slate-500">
          {t('cert.anyone')} <Link to="/verify" dir="ltr" className="font-medium text-brand-600">skillriseacademy.org/verify</Link> {t('cert.anyoneAfter')}
        </p>
      </div>
    </div>
  )
}
