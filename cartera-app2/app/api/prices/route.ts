import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

async function fetchYahooPrice(ticker: string): Promise<number | null> {
  try {
    const yahooTicker = ticker.startsWith('^') ? ticker : (ticker.endsWith('.BA') ? ticker : `${ticker}.BA`)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice || meta.previousClose
    return price ? Math.round(price * 100) / 100 : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminSupabase()
    const body = await request.json()
    const tickers: string[] = body.tickers || []

    const priceUpdates: Record<string, number> = {}

    for (const ticker of tickers) {
      if (!ticker) continue
      const price = await fetchYahooPrice(ticker)
      if (price !== null) {
        priceUpdates[ticker] = price
        await supabase.from('price_cache').upsert({ ticker, price, updated_at: new Date().toISOString() })
        await supabase.from('assets')
          .update({ current_price: price, last_price_update: new Date().toISOString() })
          .eq('ticker', ticker)
      }
    }

    // Dólar
    const dolarTypes = [
      { key: 'dolar_oficial',  endpoint: 'oficial' },
      { key: 'dolar_mep',      endpoint: 'bolsa' },
      { key: 'dolar_ccl',      endpoint: 'contadoconliqui' },
      { key: 'dolar_blue',     endpoint: 'blue' },
      { key: 'dolar_cripto',   endpoint: 'cripto' },
    ]
    for (const { key, endpoint } of dolarTypes) {
      try {
        const res = await fetch(`https://dolarapi.com/v1/dolares/${endpoint}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          await supabase.from('market_data').upsert(
            { key, buy_price: data.compra, sell_price: data.venta, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
        }
      } catch {}
    }

    // Riesgo País
    try {
      const res = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        await supabase.from('market_data').upsert(
          { key: 'riesgo_pais', value: data.valor, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      }
    } catch {}

    // Merval
    const merval = await fetchYahooPrice('^MERV')
    if (merval) {
      await supabase.from('market_data').upsert(
        { key: 'merval', value: merval, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    }

    return NextResponse.json({ success: true, prices: priceUpdates })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createAdminSupabase()
  const { data } = await supabase.from('price_cache').select('*')
  return NextResponse.json(data || [])
}
