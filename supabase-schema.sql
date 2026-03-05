-- ============================================================
-- SCHEMA — Cartera de Inversiones
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

-- Carteras (una por cliente)
create table public.portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Mi Cartera',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activos dentro de cada cartera
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  name text not null,
  ticker text not null,
  asset_type text not null check (asset_type in ('Acción Local', 'CEDEAR', 'Bono', 'Fondo Común', 'Otro')),
  currency text not null default 'ARS',
  quantity numeric not null default 0,
  buy_price numeric not null default 0,
  current_price numeric default 0,
  last_price_update timestamptz,
  created_at timestamptz default now()
);

-- Caché de precios (evita llamar Yahoo Finance en cada request)
create table public.price_cache (
  ticker text primary key,
  price numeric not null,
  updated_at timestamptz default now()
);

-- Datos de mercado (dólar, riesgo país, índices)
create table public.market_data (
  key text primary key,
  label text not null,
  value numeric,
  buy_price numeric,
  sell_price numeric,
  source text,
  updated_at timestamptz default now()
);

-- Insertar datos iniciales de mercado
insert into public.market_data (key, label, buy_price, sell_price, source) values
  ('dolar_oficial',  'Dólar Oficial',  930,  950,  'BCRA'),
  ('dolar_mep',      'Dólar MEP',      1055, 1060, 'Ámbito'),
  ('dolar_ccl',      'Dólar CCL',      1070, 1075, 'Ámbito'),
  ('dolar_blue',     'Dólar Blue',     1045, 1050, 'Ámbito'),
  ('dolar_cripto',   'Dólar Cripto',   1065, 1068, 'Binance');

insert into public.market_data (key, label, value, source) values
  ('riesgo_pais', 'Riesgo País (EMBI+)', 1150, 'JP Morgan'),
  ('merval',      'S&P Merval',          1850000, 'BYMA'),
  ('sp500',       'S&P 500',             5200, 'NYSE');

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.portfolios enable row level security;
alter table public.assets     enable row level security;
alter table public.price_cache enable row level security;
alter table public.market_data enable row level security;

-- Profiles: cada uno ve el suyo; admin ve todos
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin can view all profiles"
  on public.profiles for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Portfolios: cliente ve los suyos; admin ve todos
create policy "Client sees own portfolios"
  on public.portfolios for select
  using (user_id = auth.uid());

create policy "Admin manages all portfolios"
  on public.portfolios for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Assets: cliente ve los suyos; admin gestiona todos
create policy "Client sees own assets"
  on public.assets for select
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = assets.portfolio_id
      and portfolios.user_id = auth.uid()
    )
  );

create policy "Admin manages all assets"
  on public.assets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Price cache y market data: lectura pública, escritura solo server
create policy "Anyone can read prices"
  on public.price_cache for select using (true);

create policy "Anyone can read market data"
  on public.market_data for select using (true);

-- ── TRIGGER: auto-crear perfil al registrarse ────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
