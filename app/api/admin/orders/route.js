import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function requireAdmin(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || user?.app_metadata?.role !== 'admin') return null
  return user
}

export async function GET(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = serviceClient().from('orders').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: `Failed to load orders: ${error.message}` }, { status: 400 })
  return NextResponse.json({ orders: data })
}

export async function PATCH(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const { id, status } = await request.json()
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 })
  }

  const { data, error } = await serviceClient().from('orders').update({ status }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: `Order update failed: ${error.message}` }, { status: 400 })
  return NextResponse.json({ order: data })
}
