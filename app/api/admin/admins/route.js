import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { ADMIN_ROLE, ADMIN_ROLES, SUPER_ADMIN_ROLE } from '@/lib/adminRoles'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

function anonClient() {
  return createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function requireSuperAdmin(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const authClient = anonClient()
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || user?.app_metadata?.role !== SUPER_ADMIN_ROLE) return null
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

function serializeAccount(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
    role: user.app_metadata?.role || 'customer',
    providers: [...new Set((user.identities || []).map(identity => identity.provider).filter(Boolean))],
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  }
}

function logAdminError(context, error, extra = {}) {
  const details = {
    context,
    message: error?.message || String(error || 'Unknown error'),
    code: error?.code || null,
    status: error?.status || null,
    ...extra,
  }
  console.error('[admin-admins]', details)
  Sentry.captureException(error instanceof Error ? error : new Error(details.message), { extra: details })
}

async function listAllUsers(client) {
  const users = []
  let page = 1

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...(data.users || []))
    if (!data.nextPage || data.nextPage === page) break
    page = data.nextPage
  }

  return users
}

async function findUserByEmail(client, email) {
  const users = await listAllUsers(client)
  return users.find(user => user.email?.toLowerCase() === email) || null
}

function existingAccountResponse(user) {
  const role = user.app_metadata?.role
  const isAdmin = ADMIN_ROLES.includes(role)
  return NextResponse.json({
    error: isAdmin ? 'This email is already an admin.' : 'This email already has an account.',
    code: isAdmin ? 'already_admin' : 'existing_account',
    requiresConfirmation: !isAdmin,
    account: serializeAccount(user),
  }, { status: 409 })
}

async function syncPublicUser(client, user, role) {
  if (!user?.id || !user?.email) return
  const { error } = await client.from('users').upsert(
    { id: user.id, email: user.email, role },
    { onConflict: 'id' }
  )
  if (error) logAdminError('public.users sync failed', error, { userId: user.id, role })
}

export async function GET(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization required.' }, { status: 403 })

  const client = serviceClient()
  let users

  try {
    users = await listAllUsers(client)
  } catch (error) {
    logAdminError('list users failed', error)
    return NextResponse.json({ error: `Could not load admin accounts: ${error.message}` }, { status: 400 })
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
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const fullName = String(body.fullName || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })

  const client = serviceClient()
  let existing

  try {
    existing = await findUserByEmail(client, email)
  } catch (error) {
    logAdminError('lookup before create failed', error, { email })
    return NextResponse.json({ error: `Could not check this email: ${error.message}`, code: 'lookup_failed' }, { status: 500 })
  }

  if (existing) return existingAccountResponse(existing)

  if (!fullName) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: ADMIN_ROLE },
    user_metadata: { full_name: fullName },
  })

  if (error) {
    logAdminError('create user failed', error, { email })
    // Only GoTrue's real duplicate code/message counts. A database trigger
    // failure can contain words like "exists", which must stay a real error.
    const duplicate = error.code === 'email_exists' || /already (been )?registered/i.test(error.message || '')

    if (duplicate) {
      try {
        const raced = await findUserByEmail(client, email)
        if (raced) return existingAccountResponse(raced)
      } catch (lookupError) {
        logAdminError('lookup after duplicate failed', lookupError, { email })
      }
      return NextResponse.json({
        error: 'This email already has an account.',
        code: 'existing_account',
        requiresConfirmation: true,
      }, { status: 409 })
    }

    return NextResponse.json({
      error: `Could not create admin: ${error.message}`,
      code: 'create_failed',
      details: { code: error.code || null, status: error.status || null },
    }, { status: 500 })
  }

  await syncPublicUser(client, data.user, ADMIN_ROLE)

  return NextResponse.json({ admin: serializeAdmin(data.user) }, { status: 201 })
}

export async function PATCH(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const fullName = String(body.fullName || '').trim()
  const action = String(body.action || 'promote').trim()

  if (!id && !email) return NextResponse.json({ error: 'Admin id or email is required.' }, { status: 400 })

  const client = serviceClient()
  let user

  try {
    if (id) {
      const { data, error } = await client.auth.admin.getUserById(id)
      if (error) throw error
      user = data.user
    } else {
      user = await findUserByEmail(client, email)
    }
  } catch (error) {
    logAdminError('lookup for update failed', error, { id, email })
    return NextResponse.json({ error: `Could not load this account: ${error.message}`, code: 'lookup_failed' }, { status: 500 })
  }

  if (!user) return NextResponse.json({ error: 'Account not found.', code: 'not_found' }, { status: 404 })

  if (action === 'reset_password') {
    if (!ADMIN_ROLES.includes(user.app_metadata?.role)) {
      return NextResponse.json({ error: 'This account is not an admin.', code: 'not_admin' }, { status: 400 })
    }

    const origin = request.headers.get('origin')
    const { error } = await anonClient().auth.resetPasswordForEmail(user.email, {
      ...(origin ? { redirectTo: `${origin}/auth/reset-password` } : {}),
    })
    if (error) {
      logAdminError('password reset email failed', error, { userId: user.id })
      return NextResponse.json({ error: `Could not send the reset email: ${error.message}`, code: 'reset_failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: `Password reset email sent to ${user.email}.` })
  }

  if (action !== 'promote') return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })

  if (ADMIN_ROLES.includes(user.app_metadata?.role)) {
    return NextResponse.json({
      error: 'This email is already an admin.',
      code: 'already_admin',
      account: serializeAccount(user),
    }, { status: 409 })
  }

  const { data, error } = await client.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: ADMIN_ROLE },
    ...(fullName ? { user_metadata: { ...user.user_metadata, full_name: fullName } } : {}),
  })

  if (error) {
    logAdminError('promote failed', error, { userId: user.id })
    return NextResponse.json({ error: `Could not promote this account: ${error.message}`, code: 'promote_failed' }, { status: 500 })
  }

  await syncPublicUser(client, data.user, ADMIN_ROLE)

  return NextResponse.json({ admin: serializeAdmin(data.user), promoted: true })
}

export async function DELETE(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireSuperAdmin(request)) return NextResponse.json({ error: 'Super admin authorization required.' }, { status: 403 })

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
  if (error) {
    logAdminError('remove admin failed', error, { userId: id })
    return NextResponse.json({ error: `Could not remove admin: ${error.message}` }, { status: 400 })
  }

  const { error: syncError } = await client.from('users').update({ role: 'customer' }).eq('id', id)
  if (syncError) logAdminError('public.users demote failed', syncError, { userId: id })

  return NextResponse.json({ ok: true })
}
