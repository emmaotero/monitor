'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, TrendingUp, Globe, Lightbulb, LogOut, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/dashboard/analisis',    label: 'Análisis',         icon: TrendingUp },
  { href: '/dashboard/mercado',     label: 'Mercado',          icon: Globe },
  { href: '/dashboard/recomendaciones', label: 'Recomendaciones', icon: Lightbulb },
]

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50"
           style={{ background: '#0A1628', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Brand */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg, #1E3A6E, #0F2040)', border: '1px solid rgba(245,200,66,0.3)' }}>
            📊
          </div>
          <div>
            <p className="font-display text-sm text-white leading-tight">Mi Cartera</p>
            <p className="text-xs" style={{ color: '#475569' }}>Inversiones</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
               style={{ background: 'linear-gradient(135deg, #E8B423, #F5C842)', color: '#060B18' }}>
            {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{profile?.full_name || 'Cliente'}</p>
            <p className="text-xs truncate" style={{ color: '#475569' }}>{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: active ? 'rgba(245,200,66,0.1)' : 'transparent',
                color: active ? '#F5C842' : '#94A3B8',
                border: active ? '1px solid rgba(245,200,66,0.15)' : '1px solid transparent',
              }}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <Link href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mt-4"
            style={{ color: '#94A3B8', border: '1px solid transparent' }}>
            <Settings size={16} />
            Panel Admin
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all"
          style={{ color: '#64748B' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
