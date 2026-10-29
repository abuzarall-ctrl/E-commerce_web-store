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

export async function POST(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json()
  const raw = body.products

  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'Please provide a non-empty array of products.' }, { status: 400 })
  }

  if (raw.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 products per import.' }, { status: 400 })
  }

  const products = raw.map(p => {
    const fallbackStatus = STOCK_STATUSES.includes(p.stock_status) ? p.stock_status : STOCK_STATUSES[0]
    const stockQuantity = resolveStockQuantity(p.stock_quantity, fallbackStatus)
    return {
      name: String(p.name || '').trim(),
      description: String(p.description || '').trim(),
      category: String(p.category || '').trim().slice(0, 60) || CATEGORIES[0],
      price: Number(p.price),
      discount: Math.min(100, Math.max(0, Number(p.discount) || 0)),
      stock_quantity: stockQuantity,
      stock_status: stockStatusForQuantity(stockQuantity),
      is_fast_selling: Boolean(p.is_fast_selling),
      is_good_reviews: Boolean(p.is_good_reviews),
      image_url: String(p.image_url || '').trim(),
    }
  })

  const invalid = products.find(p => !p.name || !Number.isFinite(p.price))
  if (invalid) {
    return NextResponse.json({ error: 'Every product must have a valid "name" and "price".' }, { status: 400 })
  }

  const { data, error } = await serviceClient().from('products').insert(products).select()
  if (error) {
    return NextResponse.json({ error: `Bulk insert failed: ${error.message}. Run scripts/admin-stock.sql in the Supabase SQL Editor if stock tracking is missing.` }, { status: 400 })
  }

  return NextResponse.json({ imported: data.length, products: data }, { status: 201 })
}
