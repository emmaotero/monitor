import { NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role === 'admin') {
    const admin = createAdminSupabase()
    const { data } = await admin
      .from('portfolios')
      .select('*, profiles(email, full_name), assets(*)')
      .order('created_at', { ascending: false })
    return NextResponse.json(data || [])
  }

  const { data } = await supabase
    .from('portfolios')
    .select('*, assets(*)')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data || null)
}

export async function POST(request: Request) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminSupabase()
  const body = await request.json()
  const { user_id, name, assets } = body

  const { data: portfolio, error } = await admin
    .from('portfolios')
    .insert({ user_id, name: name || 'Mi Cartera' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (assets?.length) {
    await admin.from('assets').insert(
      assets.map((a: any) => ({ ...a, portfolio_id: portfolio.id, current_price: a.buy_price }))
    )
  }

  return NextResponse.json(portfolio)
}

export async function PUT(request: Request) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminSupabase()
  const { portfolio_id, assets } = await request.json()

  await admin.from('assets').delete().eq('portfolio_id', portfolio_id)
  if (assets?.length) {
    await admin.from('assets').insert(assets.map((a: any) => ({ ...a, portfolio_id })))
  }

  return NextResponse.json({ success: true })
}
