import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return Response.json({ success: false, error: 'Provide ?email=someone@example.com in the URL' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Find user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return Response.json({ success: false, error: listErr.message })

  const user = users.find(u => u.email === email)
  if (!user) return Response.json({ success: false, error: `No user found with email: ${email}` })

  // Grant admin role
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: { role: 'admin' } }
  )

  if (error) return Response.json({ success: false, error: error.message })
  return Response.json({ success: true, email: data.user.email, role: data.user.app_metadata.role })
}
