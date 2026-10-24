import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, STOCK_STATUSES, resolveStockQuantity, stockStatusForQuantity } from '@/lib/categories'
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

function buildProductFields(body) {
  const fields = {}
  if ('name' in body) fields.name = String(body.name || '').trim()
  if ('description' in body) fields.description = String(body.description || '').trim()
  if ('category' in body) fields.category = CATEGORIES.includes(body.category) ? body.category : CATEGORIES[0]
  if ('price' in body) fields.price = Number(body.price)
  if ('discount' in body) fields.discount = Math.min(100, Math.max(0, Number(body.discount) || 0))
  if ('image_url' in body) fields.image_url = String(body.image_url || '').trim()
  if ('is_fast_selling' in body) fields.is_fast_selling = Boolean(body.is_fast_selling)
  if ('is_good_reviews' in body) fields.is_good_reviews = Boolean(body.is_good_reviews)
  if ('stock_quantity' in body) {
    const fallbackStatus = STOCK_STATUSES.includes(body.stock_status) ? body.stock_status : STOCK_STATUSES[0]
    const quantity = resolveStockQuantity(body.stock_quantity, fallbackStatus)
    fields.stock_quantity = quantity
    fields.stock_status = stockStatusForQuantity(quantity)
  }
  return fields
}

export async function POST(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json()
  const product = buildProductFields(body)
  if (!product.name || !Number.isFinite(product.price)) return NextResponse.json({ error: 'Product name and a valid price are required.' }, { status: 400 })

  const { data, error } = await serviceClient().from('products').insert([product]).select().single()
  if (error) return NextResponse.json({ error: `Admin product insert failed: ${error.message}. Run scripts/admin-products.sql and scripts/admin-stock.sql in the Supabase SQL Editor, then restart the app.` }, { status: 400 })
  return NextResponse.json({ product: data }, { status: 201 })
}

export async function PATCH(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '').trim()
  if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 })

  const fields = buildProductFields(body)
  if ('name' in fields && !fields.name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 })
  if ('price' in fields && !Number.isFinite(fields.price)) return NextResponse.json({ error: 'A valid price is required.' }, { status: 400 })
  if (Object.keys(fields).length === 0) return NextResponse.json({ error: 'No product fields to update.' }, { status: 400 })

  const { data, error } = await serviceClient().from('products').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: `Could not update product: ${error.message}` }, { status: 400 })
  return NextResponse.json({ product: data })
}

export async function DELETE(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '').trim()
  if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 })

  const { error } = await serviceClient().from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: `Could not delete product: ${error.message}` }, { status: 400 })
  return NextResponse.json({ ok: true })
}
