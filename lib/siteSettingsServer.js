import { createClient } from '@supabase/supabase-js'
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from '@/lib/siteSettings'

const BUCKET = 'site-settings'
const FILE = 'site.json'

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function readSiteSettings() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...DEFAULT_SITE_SETTINGS }
  }

  const { data, error } = await client().storage.from(BUCKET).download(FILE)
  if (error || !data) return { ...DEFAULT_SITE_SETTINGS }

  try {
    return normalizeSiteSettings(JSON.parse(await data.text()))
  } catch {
    return { ...DEFAULT_SITE_SETTINGS }
  }
}

export async function saveSiteSettings(value) {
  const normalized = normalizeSiteSettings(value)
  const supabase = client()

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: false })
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Could not prepare the settings bucket: ${createError.message}`)
  }

  const body = JSON.stringify(normalized, null, 2)
  const { error } = await supabase.storage.from(BUCKET).upload(FILE, body, {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  })
  if (error) throw new Error(`Could not save site info: ${error.message}`)

  return normalized
}
