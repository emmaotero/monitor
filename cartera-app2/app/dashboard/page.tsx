import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import PortfolioDashboard from '@/components/PortfolioDashboard'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*, assets(*)')
    .eq('user_id', user.id)
    .single()

  const { data: marketData } = await supabase
    .from('market_data')
    .select('*')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <PortfolioDashboard
      portfolio={portfolio}
      marketData={marketData || []}
      profile={profile}
    />
  )
}
