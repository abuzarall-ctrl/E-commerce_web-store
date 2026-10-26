import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrderDetails } from '@/lib/orderPayload'
import { isAdminRole } from '@/lib/adminRoles'
import { buildOrderReceiptPdf, orderReceiptFilename } from '@/lib/orderReceipt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function optionalUser(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !anonKey) return null
  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  return error ? null : user
}

function contactMatches(order, contact) {
  if (!contact) return false
  const value = String(contact).trim().toLowerCase()
  const details = getOrderDetails(order)
  if (details.delivery.email && details.delivery.email.toLowerCase() === value) return true

  const digits = value.replace(/\D/g, '')
  if (digits.length < 10) return false
  const phone = String(details.delivery.phone || order.customer_phone || '').replace(/\D/g, '')
  return phone.length >= 10 && phone.slice(-10) === digits.slice(-10)
}

export async function GET(request) {
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server database configuration is incomplete.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const id = String(searchParams.get('id') || '').trim()
  const contact = searchParams.get('contact') || ''
  if (!id) return NextResponse.json({ error: 'A valid order id is required.' }, { status: 400 })

  const client = serviceClient()
  const { data: order, error } = await client.from('orders').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load this order.' }, { status: 400 })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const user = await optionalUser(request)
  const allowed = (user && (order.user_id === user.id || isAdminRole(user.app_metadata?.role)))
    || contactMatches(order, contact)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Verify the email or phone number used on this order to download its receipt.' },
      { status: 403 }
    )
  }

  const pdf = buildOrderReceiptPdf(order)
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${orderReceiptFilename(order)}"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
