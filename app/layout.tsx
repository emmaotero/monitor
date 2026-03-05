import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cartera de Inversiones',
  description: 'Tu plataforma de gestión de inversiones',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
