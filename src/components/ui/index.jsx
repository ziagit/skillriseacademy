import { useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle, X } from 'lucide-react'
import { cn, initials } from '../../lib/utils'

const buttonVariants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  accent: 'bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-sm',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  white: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
}
const buttonSizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 justify-center',
}

export function Button({ as, to, href, variant = 'primary', size = 'md', loading, className, children, disabled, ...props }) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 disabled:pointer-events-none disabled:opacity-60 whitespace-nowrap',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  )
  const content = (
    <>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </>
  )
  if (to) return <Link to={to} className={classes} {...props}>{content}</Link>
  if (href) return <a href={href} className={classes} {...props}>{content}</a>
  const Comp = as || 'button'
  return (
    <Comp className={classes} disabled={disabled || loading} {...props}>
      {content}
    </Comp>
  )
}

export function Field({ label, hint, error, children, className, htmlFor, required }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ label, hint, error, className, required, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <input id={id} required={required} className="input" {...props} />
    </Field>
  )
}

export function Textarea({ label, hint, error, className, rows = 4, required, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <textarea id={id} rows={rows} required={required} className="input resize-y" {...props} />
    </Field>
  )
}

export function Select({ label, hint, error, className, children, required, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <select id={id} required={required} className="input pr-8" {...props}>
        {children}
      </select>
    </Field>
  )
}

export function Checkbox({ label, description, className, ...props }) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...props} />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('min-w-0 rounded-xl border border-slate-200 bg-white shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

const badgeTones = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function Badge({ tone = 'slate', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

const STATUS_TONES = {
  draft: 'slate',
  pending: 'amber',
  published: 'green',
  archived: 'red',
  approved: 'green',
  rejected: 'red',
  submitted: 'blue',
  graded: 'green',
  returned: 'amber',
  active: 'green',
  suspended: 'red',
  admin: 'violet',
  teacher: 'blue',
  student: 'slate',
}
const STATUS_LABELS = { pending: 'In review' }

export function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONES[status] || 'slate'} className="capitalize">
      {STATUS_LABELS[status] || status?.replace('_', ' ')}
    </Badge>
  )
}

export function Spinner({ className }) {
  return <LoaderCircle className={cn('h-5 w-5 animate-spin text-brand-600', className)} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-7 w-7" />
      {label}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      <p className="font-medium">We couldn't load this data.</p>
      <p className="mt-1 text-red-600/80">{error?.message || String(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl', widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}

const avatarSizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }

export function Avatar({ src, name, size = 'md', className }) {
  if (src) return <img src={src} alt={name || ''} className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', avatarSizes[size], className)} />
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white ring-2 ring-white', avatarSizes[size], className)}>
      {initials(name)}
    </span>
  )
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint, to }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-600',
  }
  const body = (
    <Card className={cn('p-5', to && 'transition hover:border-brand-200 hover:shadow-lift')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">{value ?? '—'}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('-mx-4 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0', className)}>
      <nav className="flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition',
              value === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            {t.icon && <t.icon className="h-4 w-4" />}
            {t.label}
            {t.count != null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.count}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value = 0, className }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  )
}
