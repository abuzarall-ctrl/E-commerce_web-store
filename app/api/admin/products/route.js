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

export async function POST(request) {
  if (!serviceKey) return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 })

  const body = await request.json()
  const product = {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    category: body.category,
    price: Number(body.price),
    discount: Number(body.discount || 0),
    stock_status: body.stock_status,
    image_url: String(body.image_url || '').trim(),
  }
  if (!product.name || !Number.isFinite(product.price)) return NextResponse.json({ error: 'Product name and a valid price are required.' }, { status: 400 })

  const { data, error } = await serviceClient().from('products').insert([product]).select().single()
  if (error) return NextResponse.json({ error: `Admin product insert failed: ${error.message}. Run scripts/admin-products.sql in the Supabase SQL Editor, then restart the app.` }, { status: 400 })
  return NextResponse.json({ product: data }, { status: 201 })
}
