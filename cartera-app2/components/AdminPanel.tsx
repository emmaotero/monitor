'use client'
import { useState } from 'react'
import { Users, Plus, Edit2, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const ASSET_TYPES = ['Acción Local', 'CEDEAR', 'Bono', 'Fondo Común', 'Otro']

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR').format(n)
}

export default function AdminPanel({ clients, marketData }: any) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [editingAssets, setEditingAssets] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  function openEdit(client: any) {
    setSelectedClient(client)
    setEditingAssets((client.portfolios?.[0]?.assets || []).map((a: any) => ({ ...a })))
    setMsg('')
  }

  function addAsset() {
    setEditingAssets(p => [...p, {
      id: `new-${Date.now()}`, name: '', ticker: '',
      asset_type: 'Acción Local', currency: 'ARS', quantity: 0, buy_price: 0, current_price: 0
    }])
  }

  function removeAsset(idx: number) {
    setEditingAssets(p => p.filter((_: any, i: number) => i !== idx))
  }

  function updateAsset(idx: number, field: string, value: any) {
    setEditingAssets(p => p.map((a: any, i: number) => i === idx ? { ...a, [field]: value } : a))
  }

  async function savePortfolio() {
    if (!selectedClient) return
    setSaving(true)
    try {
      const portfolio = selectedClient.portfolios?.[0]
      const res = await fetch('/api/portfolio', {
        method: portfolio ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio
          ? { portfolio_id: portfolio.id, assets: editingAssets }
          : { user_id: selectedClient.id, assets: editingAssets }
        )
      })
      if (res.ok) {
        setMsg('✅ Cartera guardada.')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMsg('❌ Error al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function refreshAll() {
    setRefreshing(true)
    try {
      const tickers = [...new Set(
        clients.flatMap((c: any) => c.portfolios?.[0]?.assets || []).map((a: any) => a.ticker).filter(Boolean)
      )]
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      })
      setMsg('✅ Precios actualizados.')
      setTimeout(() => window.location.reload(), 1000)
    } finally {
      setRefreshing(false)
    }
  }

  const mep    = marketData.find((m: any) => m.key === 'dolar_mep')?.sell_price || 0
  const riesgo = marketData.find((m: any) => m.key === 'riesgo_pais')?.value || 0

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display text-white mb-1">Panel de Asesor</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>{clients.length} clientes registrados</p>
        </div>
        <button onClick={refreshAll} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #E8B423, #F5C842)', color: '#060B18' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar todos los precios'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Dólar MEP',    value: `$${fmt(mep)}` },
          { label: 'Riesgo País',  value: fmt(riesgo) },
          { label: 'Clientes',     value: clients.length },
          { label: 'Total activos', value: clients.reduce((s: number, c: any) => s + (c.portfolios?.[0]?.assets?.length || 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="glass p-4 rounded-xl">
            <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: '#475569' }}>{label}</p>
            <p className="text-xl font-display text-white">{value}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className="glass px-4 py-3 rounded-xl text-sm" style={{ color: '#34D399' }}>{msg}</div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Clients list */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Users size={16} style={{ color: '#64748B' }} />
            <h2 className="font-semibold text-white text-sm">Clientes</h2>
          </div>
          <div>
            {clients.length === 0 && (
              <p className="px-6 py-10 text-center text-sm" style={{ color: '#475569' }}>Sin clientes registrados.</p>
            )}
            {clients.map((client: any) => {
              const assets = client.portfolios?.[0]?.assets || []
              const totalValue = assets.reduce((s: number, a: any) => s + a.quantity * a.current_price, 0)
              const isExpanded = expanded === client.id
              return (
                <div key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #1E3A6E, #0F2040)', color: '#F5C842' }}>
                      {(client.full_name || client.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{client.full_name || client.email}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>{assets.length} activos · ${fmt(totalValue)}</p>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : client.id)} style={{ color: '#64748B' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => openEdit(client)}
                      className="p-1.5 rounded-lg" style={{ color: '#64748B', background: 'rgba(255,255,255,0.05)' }}>
                      <Edit2 size={14} />
                    </button>
                  </div>
                  {isExpanded && assets.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-xs px-8 py-2"
                         style={{ background: 'rgba(255,255,255,0.02)', color: '#94A3B8' }}>
                      <span className="text-white font-medium">{a.ticker}</span>
                      <span>{a.quantity} u.</span>
                      <span>${fmt(a.current_price)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">
              {selectedClient ? `Editando: ${selectedClient.full_name || selectedClient.email}` : 'Seleccioná un cliente ✏️'}
            </h2>
          </div>

          {!selectedClient ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: '#475569' }}>
              Hacé click en ✏️ para editar
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
              {editingAssets.map((asset, idx) => (
                <div key={asset.id} className="p-4 rounded-xl space-y-3"
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">Activo #{idx + 1}</span>
                    <button onClick={() => removeAsset(idx)} style={{ color: '#F87171' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { f: 'name',   l: 'Nombre',  t: 'text',   ph: 'YPF S.A.' },
                      { f: 'ticker', l: 'Ticker',   t: 'text',   ph: 'YPFD' },
                    ].map(({ f, l, t, ph }) => (
                      <div key={f}>
                        <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>{l}</label>
                        <input type={t} value={asset[f]} placeholder={ph}
                          onChange={e => updateAsset(idx, f, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Tipo</label>
                      <select value={asset.asset_type} onChange={e => updateAsset(idx, 'asset_type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                        style={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Moneda</label>
                      <select value={asset.currency} onChange={e => updateAsset(idx, 'currency', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                        style={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    {[
                      { f: 'quantity',  l: 'Cantidad' },
                      { f: 'buy_price', l: 'Precio compra' },
                    ].map(({ f, l }) => (
                      <div key={f}>
                        <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>{l}</label>
                        <input type="number" value={asset[f]}
                          onChange={e => updateAsset(idx, f, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addAsset}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: '#64748B' }}>
                <Plus size={14} /> Agregar activo
              </button>
            </div>
          )}

          {selectedClient && (
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setSelectedClient(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>
                Cancelar
              </button>
              <button onClick={savePortfolio} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
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
