import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderDetails } from '@/lib/orderPayload'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function optionalUser(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user } } = await client.auth.getUser(token)
  return user || null
}

function contactMatches(order, contact) {
  const { delivery } = getOrderDetails(order)
  const input = String(contact || '').trim().toLowerCase()
  if (!input) return false
  const phoneInput = input.replace(/\D/g, '')
  const phoneOrder = String(delivery.phone || '').replace(/\D/g, '')
  return input === String(delivery.email || '').toLowerCase() || (phoneInput.length >= 10 && phoneInput === phoneOrder)
}

export async function POST(request) {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Refund requests are temporarily unavailable.' }, { status: 500 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const orderId = String(body.orderId || '').trim()
  const reason = String(body.reason || '').trim().slice(0, 800)
  const contact = String(body.contact || '').trim()

  if (!orderId || !reason) {
    return NextResponse.json({ error: 'Order ID and a reason are required.' }, { status: 400 })
  }

  const client = serviceClient()
  const isFullId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  let order = null

  if (isFullId) {
    const { data } = await client.from('orders').select('*').eq('id', orderId).maybeSingle()
    order = data
  } else {
    const { data } = await client.rpc('find_order_by_short_code', { short_code: orderId })
    order = Array.isArray(data) ? data[0] : data
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found. Check the order ID and contact details.' }, { status: 404 })
  }

  const user = await optionalUser(request)
  const ownsOrder = user?.id && order.user_id === user.id
  if (!ownsOrder && !contactMatches(order, contact)) {
    return NextResponse.json({ error: 'The contact details do not match this order.' }, { status: 403 })
  }

  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'A refund can only be requested after the order is delivered.' }, { status: 400 })
  }
  if (order.refund_status === 'approved') {
    return NextResponse.json({ error: 'This order has already been refunded.' }, { status: 400 })
  }
  if (order.refund_status === 'requested') {
    return NextResponse.json({ error: 'A refund request is already under review.' }, { status: 400 })
  }

  const { error: updateError } = await client.from('orders').update({
    refund_status: 'requested',
    refund_reason: reason,
    refund_requested_at: new Date().toISOString(),
    refund_note: '',
  }).eq('id', orderId)

  if (updateError) {
    return NextResponse.json({ error: `Could not submit refund request: ${updateError.message}` }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
