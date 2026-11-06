import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { supabase, uploadMedia } from '../../lib/supabase'
import { errorMessage } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { Avatar, Button, Card, CardHeader, Input, PageHeader, Textarea } from '../../components/ui'

export default function ProfileSettings() {
  const { user, profile, refreshProfile, isTeacher } = useAuth()
  const { t } = useI18n()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    country: profile?.country || '',
    avatar_url: profile?.avatar_url || '',
  })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [password, setPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    await refreshProfile()
    toast.success(t('profile.updated'))
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadMedia(file, user.id, 'avatars')
      setForm((f) => ({ ...f, avatar_url: url }))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (password.length < 8) return toast.error(t('auth.errors.passwordLength'))
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPwBusy(false)
    if (error) return toast.error(errorMessage(error))
    setPassword('')
    toast.success(t('profile.passwordChanged'))
  }

  return (
    <>
      <PageHeader title={t('portalNav.profileSettings')} description={t('profile.description')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('profile.public')} description={isTeacher ? t('profile.publicTeacher') : t('profile.publicStudent')} />
          <form onSubmit={save} className="space-y-5 p-5">
            <div className="flex items-center gap-4">
              <Avatar src={form.avatar_url} name={form.full_name} size="xl" />
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                  {uploading ? t('upload.uploading') : t('profile.changePhoto')}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                </label>
                {form.avatar_url && (
                  <button type="button" onClick={() => setForm({ ...form, avatar_url: '' })} className="block text-xs font-medium text-red-600 hover:underline">
                    {t('profile.removePhoto')}
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label={t('contact.fullName')} required value={form.full_name} onChange={set('full_name')} />
              <Input label={t('profile.country')} value={form.country} onChange={set('country')} />
            </div>
            <Input label={t('profile.headline')} placeholder={t('profile.headlinePlaceholder')} value={form.headline} onChange={set('headline')} />
            <Textarea label={t('profile.bio')} rows={5} value={form.bio} onChange={set('bio')} />
            <Button type="submit" loading={busy}>{t('common.saveChanges')}</Button>
          </form>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('profile.account')} />
            <div className="space-y-1 p-5 text-sm">
              <p className="text-slate-500">{t('auth.email')}</p>
              <p dir="ltr" className="text-start font-medium text-slate-900">{user.email}</p>
              <p className="pt-3 text-slate-500">{t('profile.role')}</p>
              <p className="font-medium capitalize text-slate-900">{profile?.role && t(`roles.${profile.role}`)}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title={t('profile.changePassword')} />
            <form onSubmit={changePassword} className="space-y-4 p-5">
              <Input label={t('auth.reset.newPassword')} type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button type="submit" variant="secondary" loading={pwBusy}>{t('auth.reset.submit')}</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
