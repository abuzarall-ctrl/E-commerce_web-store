import { NextResponse } from 'next/server'
import { readSiteSettings } from '@/lib/siteSettingsServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await readSiteSettings()
  return NextResponse.json(
    { settings },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
