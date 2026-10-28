import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readSiteSettings, saveSiteSettings } from '@/lib/siteSettingsServer'
import { isAdminRole } from '@/lib/adminRoles'
import { tokenHasMfa } from '@/lib/adminMfa'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function requireAdmin(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !isAdminRole(user?.app_metadata?.role) || !tokenHasMfa(token)) return null
  return user
}

export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization with two-factor authentication required.' }, { status: 403 })
  const settings = await readSiteSettings()
  return NextResponse.json({ settings })
}

export async function PUT(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization with two-factor authentication required.' }, { status: 403 })

  try {
    const settings = await saveSiteSettings(await request.json())
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not save site info.' }, { status: 400 })
  }
}
