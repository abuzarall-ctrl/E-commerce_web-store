import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderDetails } from '@/lib/orderPayload'
import { productStockQuantity, stockStatusForQuantity } from '@/lib/categories'
import { isAdminRole } from '@/lib/adminRoles'

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
  if (error || !isAdminRole(user?.app_metadata?.role)) return null
  return user
}

const STOCK_CONSUMING_STATUSES = ['confirmed', 'shipped', 'delivered']
const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']

async function adjustOrderStock(client, order, direction) {
  const { items } = getOrderDetails(order)
  const quantities = new Map()

  for (const item of items) {
    if (!item?.id) continue
    const quantity = Math.max(1, Number(item.qty) || 1)
    quantities.set(item.id, (quantities.get(item.id) || 0) + quantity)
  }

  if (quantities.size === 0) return { adjusted: 0 }

  const ids = [...quantities.keys()]
  const { data: products, error } = await client
    .from('products')
    .select('id, stock_quantity, stock_status')
    .in('id', ids)

  if (error) return { error: `Could not read product stock: ${error.message}` }

  const updates = (products || []).map(product => {
    const delta = quantities.get(product.id) || 0
    const currentQuantity = productStockQuantity(product)
    const nextQuantity = direction < 0
      ? Math.max(0, currentQuantity - delta)
      : currentQuantity + delta
    return {
      id: product.id,
      stock_quantity: nextQuantity,
      stock_status: stockStatusForQuantity(nextQuantity),
    }
  })

  for (const update of updates) {
    const { error: updateError } = await client
      .from('products')
      .update({ stock_quantity: update.stock_quantity, stock_status: update.stock_status })
      .eq('id', update.id)
    if (updateError) return { error: `Could not update stock: ${updateError.message}` }
  }

  return { adjusted: updates.length }
}

export async function GET(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const client = serviceClient()
  let query = client.from('orders').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: `Failed to load orders: ${error.message}` }, { status: 400 })

  const orders = await Promise.all((data || []).map(async order => {
    if (!order.payment_receipt_path) return { ...order, payment_receipt_url: null }
    const { data: signed } = await client.storage
      .from('payment-receipts')
      .createSignedUrl(order.payment_receipt_path, 60 * 60)
    return { ...order, payment_receipt_url: signed?.signedUrl || null }
  }))

  return NextResponse.json({ orders })
}

export async function PATCH(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json()
  const { id, action } = body
  let status = body.status
  if (!id) {
    return NextResponse.json({ error: 'A valid order id is required.' }, { status: 400 })
  }

  const client = serviceClient()
  const { data: currentOrder, error: fetchError } = await client
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !currentOrder) {
    return NextResponse.json({ error: `Order not found: ${fetchError?.message || 'missing order'}` }, { status: 404 })
  }

  const note = String(body.note || '').trim().slice(0, 600)

  if (action === 'verify-payment') {
    const { data, error } = await client.from('orders').update({
      payment_status: 'verified',
      payment_verified_at: new Date().toISOString(),
      payment_note: note,
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: `Payment update failed: ${error.message}` }, { status: 400 })
    return NextResponse.json({ order: data })
  }

  if (action === 'reject-payment') {
    const { data, error } = await client.from('orders').update({
      payment_status: 'rejected',
      payment_note: note,
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: `Payment update failed: ${error.message}` }, { status: 400 })
    return NextResponse.json({ order: data })
  }

  if (action === 'reject-refund') {
    const { data, error } = await client.from('orders').update({
      refund_status: 'rejected',
      refund_note: note,
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: `Refund update failed: ${error.message}` }, { status: 400 })
    return NextResponse.json({ order: data })
  }

  const extraUpdate = {}
  if (action === 'approve-refund') {
    if (currentOrder.status !== 'delivered') {
      return NextResponse.json({ error: 'Only delivered orders can be refunded.' }, { status: 400 })
    }
    status = 'refunded'
    extraUpdate.refund_status = 'approved'
    extraUpdate.refund_note = note
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 })
  }

  if (status === 'refunded' && currentOrder.refund_status !== 'approved') {
    extraUpdate.refund_status = 'approved'
  }

  if (STOCK_CONSUMING_STATUSES.includes(status)
    && currentOrder.payment_method
    && currentOrder.payment_method !== 'cod'
    && currentOrder.payment_status !== 'verified') {
    return NextResponse.json({ error: 'Verify the payment receipt before confirming this order.' }, { status: 400 })
  }

  const supportsStockFlag = Object.prototype.hasOwnProperty.call(currentOrder, 'stock_deducted')
  const wasDeducted = supportsStockFlag && typeof currentOrder.stock_deducted === 'boolean'
    ? currentOrder.stock_deducted
    : STOCK_CONSUMING_STATUSES.includes(currentOrder.status)
  const shouldBeDeducted = STOCK_CONSUMING_STATUSES.includes(status)

  const update = { status, ...extraUpdate }
  let stockResult = { adjusted: 0 }
  let appliedDirection = 0

  if (!wasDeducted && shouldBeDeducted) {
    stockResult = await adjustOrderStock(client, currentOrder, -1)
    if (stockResult.error) return NextResponse.json({ error: stockResult.error }, { status: 400 })
    appliedDirection = -1
    if (supportsStockFlag) update.stock_deducted = true
  } else if (wasDeducted && !shouldBeDeducted) {
    stockResult = await adjustOrderStock(client, currentOrder, 1)
    if (stockResult.error) return NextResponse.json({ error: stockResult.error }, { status: 400 })
    appliedDirection = 1
    if (supportsStockFlag) update.stock_deducted = false
  }

  const { data, error } = await client.from('orders').update(update).eq('id', id).select().single()
  if (error) {
    if (appliedDirection) await adjustOrderStock(client, currentOrder, -appliedDirection)
    return NextResponse.json({ error: `Order update failed: ${error.message}` }, { status: 400 })
  }
  return NextResponse.json({ order: data, stockAdjusted: stockResult.adjusted || 0 })
}
