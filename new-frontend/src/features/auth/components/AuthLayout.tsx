import { BuildOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="from-background via-background to-muted/20 flex min-h-screen flex-col bg-gradient-to-br">
      <header className="border-border border-b px-4 py-4 sm:px-6">
        <Link to="/" className="text-foreground inline-flex items-center gap-2">
          <BuildOutlined className="text-primary text-2xl" />
          <span className="text-lg font-bold">BizTrack</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="border-border bg-card w-full max-w-md rounded-xl border p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-foreground text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
          </div>
          {children}
          <div className="text-muted-foreground mt-6 text-center text-sm">{footer}</div>
        </div>
      </main>
    </div>
  )
}