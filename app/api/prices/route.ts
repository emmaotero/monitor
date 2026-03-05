import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

// Fetch price from Yahoo Finance
async function fetchYahooPrice(ticker: string): Promise<number | null> {
  try {
    const yahooTicker = ticker.endsWith('.BA') ? ticker : `${ticker}.BA`
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 }
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

// Fetch dolar and market data
async function fetchMarketData() {
  const results: Record<string, any> = {}

  // Dólar types
  const dolarTypes = [
    { key: 'dolar_oficial',  endpoint: 'oficial' },
    { key: 'dolar_mep',      endpoint: 'bolsa' },
    { key: 'dolar_ccl',      endpoint: 'contadoconliqui' },
    { key: 'dolar_blue',     endpoint: 'blue' },
    { key: 'dolar_cripto',   endpoint: 'cripto' },
  ]

  for (const { key, endpoint } of dolarTypes) {
    try {
      const res = await fetch(`https://dolarapi.com/v1/dolares/${endpoint}`, {
        next: { revalidate: 0 }
      })
      if (res.ok) {
        const data = await res.json()
        results[key] = { buy_price: data.compra, sell_price: data.venta }
      }
    } catch {}
  }

  // Riesgo País
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo', {
      next: { revalidate: 0 }
    })
    if (res.ok) {
      const data = await res.json()
      results['riesgo_pais'] = { value: data.valor }
    }
  } catch {}

  // Merval
  const merval = await fetchYahooPrice('^MERV')
  if (merval) results['merval'] = { value: merval }

  // S&P 500
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 }
    })
    if (res.ok) {
      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (meta?.regularMarketPrice) results['sp500'] = { value: meta.regularMarketPrice }
    }
  } catch {}

  return results
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminSupabase()
    const body = await request.json()
    const tickers: string[] = body.tickers || []

    // Update asset prices
    const priceUpdates: Record<string, number> = {}
    for (const ticker of tickers) {
      if (!ticker || ticker === '') continue
      const price = await fetchYahooPrice(ticker)
      if (price !== null) {
        priceUpdates[ticker] = price
        // Update price cache
        await supabase.from('price_cache').upsert({
          ticker,
          price,
          updated_at: new Date().toISOString()
        })
        // Update all assets with this ticker
        await supabase.from('assets')
          .update({ current_price: price, last_price_update: new Date().toISOString() })
          .eq('ticker', ticker)
      }
    }

    // Update market data
    const marketUpdates = await fetchMarketData()
    for (const [key, data] of Object.entries(marketUpdates)) {
      await supabase.from('market_data').upsert({
        key,
        ...data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    }

    return NextResponse.json({
      success: true,
      prices: priceUpdates,
      market: Object.keys(marketUpdates)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createAdminSupabase()
  const { data } = await supabase.from('price_cache').select('*')
  return NextResponse.json(data || [])
}
