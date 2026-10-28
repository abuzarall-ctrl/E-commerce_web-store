import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_ROLE, ADMIN_ROLES, SUPER_ADMIN_ROLE } from '@/lib/adminRoles'
import { tokenHasMfa } from '@/lib/adminMfa'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function requireSuperAdmin(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || user?.app_metadata?.role !== SUPER_ADMIN_ROLE || !tokenHasMfa(token)) return null
  return user
}

function serializeAdmin(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || '',
    role: user.app_metadata?.role,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  }
}

export async function GET(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization with two-factor authentication required.' }, { status: 403 })

  const client = serviceClient()
  const users = []
  let page = 1

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return NextResponse.json({ error: `Could not load admin accounts: ${error.message}` }, { status: 400 })
    users.push(...(data.users || []))
    if (!data.nextPage || data.nextPage === page) break
    page = data.nextPage
  }

  const admins = users
    .filter(user => ADMIN_ROLES.includes(user.app_metadata?.role))
    .map(serializeAdmin)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === SUPER_ADMIN_ROLE ? -1 : 1
      return (a.email || '').localeCompare(b.email || '')
    })

  return NextResponse.json({ admins })
}

export async function POST(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization with two-factor authentication required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const fullName = String(body.fullName || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!fullName) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: ADMIN_ROLE },
    user_metadata: { full_name: fullName },
  })

  if (error) {
    const message = /already|exists|registered/i.test(error.message)
      ? 'An account with this email already exists.'
      : `Could not create admin: ${error.message}`
    return NextResponse.json({ error: message }, { status: /already|exists|registered/i.test(error.message) ? 409 : 400 })
  }

  return NextResponse.json({ admin: serializeAdmin(data.user) }, { status: 201 })
}

export async function DELETE(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization with two-factor authentication required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '').trim()
  if (!id) return NextResponse.json({ error: 'Admin id is required.' }, { status: 400 })

  const client = serviceClient()
  const { data: { user }, error: getError } = await client.auth.admin.getUserById(id)
  if (getError || !user) return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 })
  if (user.app_metadata?.role === SUPER_ADMIN_ROLE) {
    return NextResponse.json({ error: 'Super admin accounts cannot be removed from this portal.' }, { status: 400 })
  }
  if (user.app_metadata?.role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'This account is not an admin.' }, { status: 400 })
  }

  const { error } = await client.auth.admin.updateUserById(id, {
    app_metadata: { ...user.app_metadata, role: 'customer' },
  })
  if (error) return NextResponse.json({ error: `Could not remove admin: ${error.message}` }, { status: 400 })

  await client.from('users').update({ role: 'customer' }).eq('id', id)

  return NextResponse.json({ ok: true })
}
