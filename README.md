# 📊 Cartera de Inversiones — Setup Guide

## Stack
- **Next.js 14** — Frontend + API (App Router)
- **Supabase** — Base de datos + Autenticación
- **Vercel** — Deploy automático
- **Yahoo Finance** — Precios automáticos
- **dolarapi.com** — Dólar (oficial, MEP, CCL, blue, cripto)
- **argentinadatos.com** — Riesgo país

---

## Paso 1 — Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo
2. Andá a **SQL Editor** y ejecutá todo el contenido de `supabase-schema.sql`
3. En **Project Settings → API** copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 2 — Subir a GitHub

1. Creá un repo nuevo en GitHub (puede ser privado)
2. Subí todos estos archivos al repo

---

## Paso 3 — Deploy en Vercel

1. Entrá a [vercel.com](https://vercel.com) → **Add New Project**
2. Importá el repo de GitHub
3. En **Environment Variables** agregá las 3 variables de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Click en **Deploy** — Vercel construye y despliega automáticamente

---

## Paso 4 — Crear el primer usuario admin

1. En Supabase → **Authentication → Users** → **Add User**
2. Ingresá tu email y contraseña
3. En **SQL Editor** ejecutá:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';
   ```
4. Listo. Entrás con ese email y ves el panel de asesor.

---

## Paso 5 — Crear clientes

1. Entrás al panel admin en la app
2. En Supabase → Authentication → Add User → creás el usuario del cliente
3. En el panel admin, buscás el cliente y cargás su cartera
4. El cliente entra con su email/contraseña y ve solo su cartera

---

## Estructura de archivos

```
cartera-app/
├── app/
│   ├── api/
│   │   ├── prices/route.ts      ← Fetch Yahoo Finance + dólar
│   │   └── portfolio/route.ts   ← CRUD carteras
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx             ← Vista del cliente
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx             ← Panel del asesor
│   ├── login/page.tsx
│   ├── layout.tsx
│   └── page.tsx                 ← Redirect según rol
├── components/
│   ├── Sidebar.tsx
│   ├── PortfolioDashboard.tsx   ← Dashboard del cliente
│   └── AdminPanel.tsx           ← Panel del asesor
├── lib/
│   ├── supabase.ts              ← Cliente browser
│   └── supabase-server.ts       ← Cliente server
├── types/index.ts
├── supabase-schema.sql          ← Ejecutar en Supabase
└── .env.local.example           ← Renombrar a .env.local
```

---

## Actualización automática de precios

Los precios se actualizan cuando:
1. El cliente hace click en **"Actualizar precios"** en el dashboard
2. El asesor hace click en **"Actualizar todos los precios"** en el admin

Para actualización completamente automática (sin click), podés configurar un **Cron Job en Vercel**:
- Vercel → Settings → Cron Jobs → `0 9 * * 1-5` (lunes a viernes a las 9 AM)
- URL: `https://TU-APP.vercel.app/api/prices`

---

## Tickers de referencia

| Activo | Ticker |
|--------|--------|
| YPF | YPFD |
| Banco Galicia | GGAL |
| Pampa Energía | PAMP |
| Banco Macro | BMA |
| Com. del Plata | COME |
| MercadoLibre | MELI |
| Apple | AAPL |
| Amazon | AMZN |
| Tesla | TSLA |
| Microsoft | MSFT |
| Nvidia | NVDA |
| Bono AL30 | AL30D |
| Bono GD30 | GD30D |

> El sistema agrega `.BA` automáticamente para buscar en Yahoo Finance (mercado argentino en pesos).
