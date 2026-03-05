export type AssetType = 'Acción Local' | 'CEDEAR' | 'Bono' | 'Fondo Común' | 'Otro'

export interface Asset {
  id: string
  portfolio_id: string
  name: string
  ticker: string
  asset_type: AssetType
  currency: string
  quantity: number
  buy_price: number
  current_price: number
  last_price_update?: string
}

export interface AssetWithCalc extends Asset {
  total_invested: number
  current_value: number
  gain_loss: number
  return_pct: number
  portfolio_weight: number
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'client'
}

export interface MarketData {
  key: string
  label: string
  value?: number
  buy_price?: number
  sell_price?: number
  source?: string
  updated_at: string
}
