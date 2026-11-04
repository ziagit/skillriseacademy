import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Copy .env.example to .env and add your project keys.')
}

// A placeholder client lets the public site render (with empty data) before keys are added.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function uploadMedia(file, userId, folder = 'uploads') {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
