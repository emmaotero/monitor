'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { AssetWithCalc, MarketData } from '@/types'

function calcAssets(assets: any[]): AssetWithCalc[] {
  const totalValue = assets.reduce((s, a) => s + a.quantity * a.current_price, 0)
  return assets.map(a => {
    const invested = a.quantity * a.buy_price
    const value    = a.quantity * a.current_price
    return {
      ...a,
      total_invested: invested,
      current_value: value,
      gain_loss: value - invested,
      return_pct: invested > 0 ? (value - invested) / invested : 0,
      portfolio_weight: totalValue > 0 ? value / totalValue : 0,
    }
  })
}

function fmt(n: number, dec = 0) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
}
function fmtPct(n: number) {
  return `${n > 0 ? '+' : ''}${(n * 100).toFixed(2)}%`
}

const COLORS = ['#E8B423','#34D399','#60A5FA','#A78BFA','#F87171','#FB923C','#38BDF8']

export default function PortfolioDashboard({ portfolio, marketData, profile }: any) {
  const [refreshing, setRefreshing] = useState(false)

  const assets: AssetWithCalc[] = portfolio?.assets ? calcAssets(portfolio.assets) : []
  const totalInvested = assets.reduce((s, a) => s + a.total_invested, 0)
  const totalValue    = assets.reduce((s, a) => s + a.current_value, 0)
  const totalGain     = totalValue - totalInvested
  const totalReturn   = totalInvested > 0 ? totalGain / totalInvested : 0

  const mep    = marketData.find((m: MarketData) => m.key === 'dolar_mep')?.sell_price || 0
  const riesgo = marketData.find((m: MarketData) => m.key === 'riesgo_pais')?.value || 0

  const pieData = assets
    .filter(a => a.current_value > 0)
    .map(a => ({ name: a.name, value: a.current_value, weight: a.portfolio_weight }))

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const tickers = assets.map(a => a.ticker).filter(Boolean)
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      })
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  const signalFor = (r: number) => {
    if (r > 0.08)  return { label: 'COMPRAR',   cls: 'badge badge-buy' }
    if (r > 0)     return { label: 'MANTENER',  cls: 'badge badge-hold' }
    if (r > -0.05) return { label: 'PRECAUCIÓN',cls: 'badge badge-caution' }
    return             { label: 'REVISAR',    cls: 'badge badge-sell' }
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center glass p-12 max-w-sm">
          <p className="text-4xl mb-4">📊</p>
          <h2 className="text-white font-display text-xl mb-2">Sin cartera asignada</h2>
          <p className="text-sm" style={{ color: '#64748B' }}>Tu asesor aún no configuró tu cartera.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display text-white mb-1">
            Hola, {profile?.full_name?.split(' ')[0] || 'Inversor'} 👋
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            {portfolio.name} · {assets.length} activos
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar precios'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 animate-fadeUp-2">
        {[
          { label: 'Valor Total',       value: `$${fmt(totalValue)}`,  sub: `Invertido: $${fmt(totalInvested)}`, color: '#E8EDF5' },
          { label: 'Ganancia/Pérdida',  value: `${totalGain >= 0 ? '+' : ''}$${fmt(totalGain)}`, sub: fmtPct(totalReturn), color: totalGain >= 0 ? '#34D399' : '#F87171' },
          { label: 'Dólar MEP',         value: `$${fmt(mep)}`,         sub: 'Cotización de referencia', color: '#F5C842' },
          { label: 'Riesgo País',       value: fmt(riesgo),            sub: 'EMBI+ Argentina', color: riesgo > 1500 ? '#F87171' : riesgo > 800 ? '#F5C842' : '#34D399' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="glass p-5 rounded-2xl">
            <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#475569' }}>{label}</p>
            <p className="text-2xl font-display mb-1" style={{ color }}>{value}</p>
            <p className="text-xs" style={{ color: '#475569' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Macro strip */}
      <div className="flex gap-3 animate-fadeUp-3 flex-wrap">
        {marketData
          .filter((m: MarketData) => ['dolar_oficial','dolar_blue','dolar_ccl','merval'].includes(m.key))
          .map((m: MarketData) => (
            <div key={m.key} className="glass px-4 py-3 rounded-xl flex items-center gap-3">
              <p className="text-xs" style={{ color: '#475569' }}>{m.label}</p>
              <p className="text-sm font-semibold text-white">
                {m.buy_price ? `$${fmt(m.sell_price || 0)}` : fmt(m.value || 0)}
              </p>
            </div>
          ))}
      </div>

      {/* Table + Pie */}
      <div className="grid grid-cols-3 gap-6 animate-fadeUp-4">
        <div className="col-span-2 glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">Composición de cartera</h2>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Activo</th>
                <th>Precio</th>
                <th>Valor</th>
                <th>Rendim.</th>
                <th>% Cart.</th>
                <th>Señal</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const sig = signalFor(asset.return_pct)
                return (
                  <tr key={asset.id}>
                    <td>
                      <p className="text-white text-sm font-medium">{asset.name}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>{asset.ticker} · {asset.asset_type}</p>
                    </td>
                    <td className="text-center text-sm text-white">${fmt(asset.current_price, 2)}</td>
                    <td className="text-center text-sm text-white">${fmt(asset.current_value)}</td>
                    <td className="text-center">
                      <span className={`text-sm font-semibold ${asset.return_pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fmtPct(asset.return_pct)}
                      </span>
                    </td>
                    <td className="text-center text-sm" style={{ color: '#94A3B8' }}>
                      {(asset.portfolio_weight * 100).toFixed(1)}%
                    </td>
                    <td className="text-center">
                      <span className={sig.cls}>{sig.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t flex justify-between"
               style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#475569' }}>Total</span>
            <div className="flex gap-8">
              <span className="text-sm text-white font-semibold">${fmt(totalValue)}</span>
              <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtPct(totalReturn)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-semibold text-white text-sm mb-4">Distribución</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`$${fmt(v)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: '#94A3B8' }}>{d.name}</span>
                  </div>
                  <span className="text-white font-medium">{(d.weight * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white text-sm mb-3">Resumen</h2>
            {[
              { label: 'Activos positivos', value: `${assets.filter(a => a.return_pct > 0).length} / ${assets.length}` },
              { label: 'Mejor activo', value: assets.length ? assets.reduce((m,a) => a.return_pct > m.return_pct ? a : m, assets[0])?.ticker : '—' },
              { label: 'Peor activo',  value: assets.length ? assets.reduce((m,a) => a.return_pct < m.return_pct ? a : m, assets[0])?.ticker : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span style={{ color: '#64748B' }}>{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
