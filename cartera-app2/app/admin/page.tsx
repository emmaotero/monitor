import { createAdminSupabase } from '@/lib/supabase-server'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const admin = createAdminSupabase()

  const { data: clients } = await admin
    .from('profiles')
    .select('*, portfolios(*, assets(*))')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const { data: marketData } = await admin.from('market_data').select('*')

  return <AdminPanel clients={clients || []} marketData={marketData || []} />
}
