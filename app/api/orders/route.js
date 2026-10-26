import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildOrderPayload } from '@/lib/orderPayload'
import { productStockQuantity } from '@/lib/categories'
import { isAdminRole } from '@/lib/adminRoles'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const RECEIPT_BUCKET = 'payment-receipts'
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank: 'Bank Transfer',
}

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

function authClient() {
  return createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function optionalUser(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const { data: { user } } = await authClient().auth.getUser(token)
  return user || null
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''))
  } catch {
    return fallback
  }
}

function fileExtension(file) {
  const fromName = String(file?.name || '').split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  if (file?.type === 'application/pdf') return 'pdf'
  if (file?.type === 'image/png') return 'png'
  if (file?.type === 'image/webp') return 'webp'
  return 'jpg'
}

async function ensureReceiptBucket(client) {
  const { error } = await client.storage.createBucket(RECEIPT_BUCKET, { public: false })
  if (error && !/already exists|duplicate|resource already exists/i.test(error.message || '')) {
    return error.message
  }
  return null
}

export async function POST(request) {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Ordering is temporarily unavailable.' }, { status: 500 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Could not read the order form.' }, { status: 400 })
  }

  const rawItems = parseJson(formData.get('items'), [])
  const deliveryInput = parseJson(formData.get('delivery'), {})
  const notes = String(formData.get('notes') || '').trim().slice(0, 600)
  const paymentMethod = PAYMENT_LABELS[String(formData.get('paymentMethod') || 'cod')]
    ? String(formData.get('paymentMethod') || 'cod')
    : 'cod'
  const receipt = formData.get('receipt')

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  const delivery = {
    name: String(deliveryInput.name || '').trim().slice(0, 120),
    phone: String(deliveryInput.phone || '').trim().slice(0, 40),
    email: String(deliveryInput.email || '').trim().toLowerCase().slice(0, 160),
    address: String(deliveryInput.address || '').trim().slice(0, 400),
    city: String(deliveryInput.city || '').trim().slice(0, 80),
  }

  if (!delivery.name || !delivery.phone || !delivery.address || !delivery.city) {
    return NextResponse.json({ error: 'Name, phone, address and city are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (delivery.phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })
  }

  const isOnlinePayment = paymentMethod !== 'cod'
  const hasReceipt = receipt && typeof receipt !== 'string' && Number(receipt.size) > 0
  if (isOnlinePayment && !hasReceipt) {
    return NextResponse.json({ error: 'Upload your transaction receipt for online payments.' }, { status: 400 })
  }
  if (hasReceipt && Number(receipt.size) > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: 'Receipt must be smaller than 5 MB.' }, { status: 400 })
  }

  const client = serviceClient()
  const quantityById = new Map()
  for (const item of rawItems) {
    const id = String(item?.id || '')
    if (!id) continue
    const quantity = Math.max(1, Math.floor(Number(item?.qty) || 1))
    quantityById.set(id, (quantityById.get(id) || 0) + quantity)
  }
  if (quantityById.size === 0) {
    return NextResponse.json({ error: 'Your cart items could not be read.' }, { status: 400 })
  }

  const { data: products, error: productError } = await client
    .from('products')
    .select('id, name, category, price, discount, stock_quantity, stock_status, image_url')
    .in('id', [...quantityById.keys()])

  if (productError) {
    return NextResponse.json({ error: `Could not verify stock: ${productError.message}` }, { status: 400 })
  }

  const items = []
  for (const product of products || []) {
    const quantity = quantityById.get(product.id) || 0
    const available = productStockQuantity(product)
    if (available <= 0 || product.stock_status === 'out of stock') {
      return NextResponse.json({ error: `${product.name} is out of stock.` }, { status: 400 })
    }
    if (quantity > available) {
      return NextResponse.json({ error: `Only ${available} left of ${product.name}.` }, { status: 400 })
    }
    const discount = Number(product.discount) || 0
    const finalPrice = Math.round(Number(product.price) - (Number(product.price) * discount / 100))
    items.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      discount,
      finalPrice,
      qty: quantity,
      image_url: product.image_url,
    })
  }

  if (items.length !== quantityById.size) {
    return NextResponse.json({ error: 'One or more products are no longer available.' }, { status: 400 })
  }

  const total = items.reduce((sum, item) => sum + item.finalPrice * item.qty, 0)
  const user = await optionalUser(request)
  if (user && isAdminRole(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'Admin accounts cannot place orders. Please use a customer account.' }, { status: 403 })
  }

  let receiptPath = null
  if (isOnlinePayment && hasReceipt) {
    const bucketError = await ensureReceiptBucket(client)
    if (bucketError) {
      return NextResponse.json({ error: `Receipt storage is unavailable: ${bucketError}` }, { status: 500 })
    }

    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${fileExtension(receipt)}`
    const buffer = Buffer.from(await receipt.arrayBuffer())
    const { error: uploadError } = await client.storage.from(RECEIPT_BUCKET).upload(path, buffer, {
      contentType: receipt.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) {
      return NextResponse.json({ error: `Could not upload receipt: ${uploadError.message}` }, { status: 400 })
    }
    receiptPath = path
  }

  const productsPayload = buildOrderPayload(items, delivery, {
    notes,
    payment: PAYMENT_LABELS[paymentMethod],
  })

  const { data: order, error: insertError } = await client.from('orders').insert({
    user_id: user?.id || null,
    products: productsPayload,
    total,
    status: 'pending',
    payment_method: paymentMethod,
    payment_status: isOnlinePayment ? 'awaiting_verification' : 'cod',
    payment_receipt_path: receiptPath,
    refund_status: 'none',
  }).select('id, total, payment_status').single()

  if (insertError) {
    if (receiptPath) await client.storage.from(RECEIPT_BUCKET).remove([receiptPath])
    return NextResponse.json({ error: `Could not place order: ${insertError.message}` }, { status: 400 })
  }

  return NextResponse.json({ order }, { status: 201 })
}
