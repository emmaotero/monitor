'use client'
import { useState } from 'react'
import { Users, Plus, Edit2, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const ASSET_TYPES = ['Acción Local', 'CEDEAR', 'Bono', 'Fondo Común', 'Otro']
const TICKERS_REF = {
  'Acción Local': ['YPFD', 'GGAL', 'PAMP', 'BMA', 'COME', 'TECO2', 'TGSU2', 'ALUA', 'CEPU', 'LOMA'],
  'CEDEAR': ['MELI', 'AAPL', 'AMZN', 'GOOGL', 'TSLA', 'MSFT', 'NVDA', 'BRKB'],
  'Bono': ['AL30D', 'GD30D', 'AL35D', 'GD35D', 'AE38D'],
  'Fondo Común': [],
  'Otro': [],
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 }).format(n)
}

export default function AdminPanel({ clients, marketData }: any) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [editingAssets, setEditingAssets] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

  function openEdit(client: any) {
    setSelectedClient(client)
    const assets = client.portfolios?.[0]?.assets || []
    setEditingAssets(assets.map((a: any) => ({ ...a })))
    setMsg('')
  }

  function addAsset() {
    setEditingAssets(prev => [...prev, {
      id: `new-${Date.now()}`,
      name: '', ticker: '', asset_type: 'Acción Local',
      currency: 'ARS', quantity: 0, buy_price: 0, current_price: 0
    }])
  }

  function removeAsset(idx: number) {
    setEditingAssets(prev => prev.filter((_, i) => i !== idx))
  }

  function updateAsset(idx: number, field: string, value: any) {
    setEditingAssets(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }

  async function savePortfolio() {
    if (!selectedClient) return
    setSaving(true)
    try {
      const portfolio = selectedClient.portfolios?.[0]
      const method = portfolio ? 'PUT' : 'POST'
      const body = portfolio
        ? { portfolio_id: portfolio.id, assets: editingAssets }
        : { user_id: selectedClient.id, assets: editingAssets }

      const res = await fetch('/api/portfolio', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setMsg('✅ Cartera guardada correctamente.')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setMsg('❌ Error al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function refreshPrices() {
    setRefreshing(true)
    try {
      const allTickers = clients
        .flatMap((c: any) => c.portfolios?.[0]?.assets || [])
        .map((a: any) => a.ticker)
        .filter(Boolean)
      const unique = Array.from(new Set(allTickers))
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: unique })
      })
      setMsg('✅ Precios actualizados para todos los clientes.')
      setTimeout(() => window.location.reload(), 1200)
    } finally {
      setRefreshing(false)
    }
  }

  const mep = marketData.find((m: any) => m.key === 'dolar_mep')?.sell_price || 0
  const riesgo = marketData.find((m: any) => m.key === 'riesgo_pais')?.value || 0

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display text-white mb-1">Panel de Asesor</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>{clients.length} clientes · Gestioná carteras y precios</p>
        </div>
        <button onClick={refreshPrices} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, #E8B423, #F5C842)', color: '#060B18' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar todos los precios'}
        </button>
      </div>

      {/* Market data strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Dólar MEP', value: `$${fmt(mep)}` },
          { label: 'Riesgo País', value: fmt(riesgo) },
          { label: 'Clientes activos', value: clients.filter((c:any) => c.portfolios?.length > 0).length },
          { label: 'Total activos gestionados', value: clients.reduce((s:number,c:any) => s + (c.portfolios?.[0]?.assets?.length || 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="glass p-4 rounded-xl">
            <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: '#475569' }}>{label}</p>
            <p className="text-xl font-display text-white">{value}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className="glass px-4 py-3 rounded-xl text-sm" style={{ color: '#34D399', borderColor: 'rgba(52,211,153,0.2)' }}>
          {msg}
        </div>
      )}

      {/* Clients list + edit */}
      <div className="grid grid-cols-2 gap-6">
        {/* Clients */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Users size={16} style={{ color: '#64748B' }} />
            <h2 className="font-semibold text-white text-sm">Clientes</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {clients.map((client: any) => {
              const portfolio = client.portfolios?.[0]
              const assets = portfolio?.assets || []
              const totalValue = assets.reduce((s: number, a: any) => s + (a.quantity * a.current_price), 0)
              const isExpanded = expandedClient === client.id

              return (
                <div key={client.id}>
                  <div className="px-6 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-all">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #1E3A6E, #0F2040)', color: '#F5C842' }}>
                      {client.full_name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{client.full_name || client.email}</p>
                      <p className="text-xs truncate" style={{ color: '#475569' }}>
                        {assets.length} activos · ${fmt(totalValue)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        className="p-1.5 rounded-lg transition-all" style={{ color: '#64748B' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => openEdit(client)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: '#64748B', background: 'rgba(255,255,255,0.05)' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && assets.length > 0 && (
                    <div className="px-6 pb-4 space-y-1">
                      {assets.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg"
                             style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-white">{a.ticker}</span>
                          <span style={{ color: '#94A3B8' }}>{a.quantity} u.</span>
                          <span className="text-white">${fmt(a.current_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {clients.length === 0 && (
              <div className="px-6 py-10 text-center text-sm" style={{ color: '#475569' }}>
                No hay clientes registrados aún.
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">
              {selectedClient ? `Editando: ${selectedClient.full_name || selectedClient.email}` : 'Seleccioná un cliente'}
            </h2>
          </div>

          {!selectedClient ? (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#475569' }}>
              Hacé click en ✏️ para editar una cartera
            </div>
          ) : (
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {editingAssets.map((asset, idx) => (
                <div key={asset.id} className="p-4 rounded-xl space-y-3"
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">Activo #{idx + 1}</span>
                    <button onClick={() => removeAsset(idx)} className="text-crimson-400 hover:text-crimson-300">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: 'name', label: 'Nombre', type: 'text', placeholder: 'YPF S.A.' },
                      { field: 'ticker', label: 'Ticker', type: 'text', placeholder: 'YPFD' },
                    ].map(({ field, label, type, placeholder }) => (
                      <div key={field}>
                        <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>{label}</label>
                        <input type={type} value={asset[field]} placeholder={placeholder}
                          onChange={e => updateAsset(idx, field, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}

                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Tipo</label>
                      <select value={asset.asset_type} onChange={e => updateAsset(idx, 'asset_type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                        style={{ background: 'rgba(15,32,64,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Moneda</label>
                      <select value={asset.currency} onChange={e => updateAsset(idx, 'currency', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                        style={{ background: 'rgba(15,32,64,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    {[
                      { field: 'quantity', label: 'Cantidad' },
                      { field: 'buy_price', label: 'Precio compra' },
                    ].map(({ field, label }) => (
                      <div key={field}>
                        <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>{label}</label>
                        <input type="number" value={asset[field]}
                          onChange={e => updateAsset(idx, field, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={addAsset}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: '#64748B' }}>
                <Plus size={14} /> Agregar activo
              </button>
            </div>
          )}

          {selectedClient && (
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setSelectedClient(null)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>
                Cancelar
              </button>
              <button onClick={savePortfolio} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #E8B423, #F5C842)', color: '#060B18' }}>
                {saving ? 'Guardando...' : 'Guardar cartera'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
