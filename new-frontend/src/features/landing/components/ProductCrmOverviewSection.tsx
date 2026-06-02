import {
  AimOutlined,
  BarChartOutlined,
  FolderOpenOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { ComponentType } from 'react'
import { cn } from '../../../lib/utils'

const MODULES: {
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  accent: 'blue' | 'green'
}[] = [
  {
    Icon: TeamOutlined,
    title: 'CRM & Customers',
    description: 'Manage leads, contacts, companies, and opportunities in one pipeline.',
    accent: 'blue',
  },
  {
    Icon: AimOutlined,
    title: 'Sales & Quotes',
    description: 'Quotes, contracts, invoices, and delivery notes tied to your CRM.',
    accent: 'green',
  },
  {
    Icon: FolderOpenOutlined,
    title: 'Projects & Tasks',
    description: 'Plan work, assign teams, track time, and deliver on schedule.',
    accent: 'blue',
  },
  {
    Icon: InboxOutlined,
    title: 'Inventory & Warehouses',
    description: 'Stock movements, purchase orders, alerts, and multi-location control.',
    accent: 'green',
  },
  {
    Icon: ShoppingCartOutlined,
    title: 'POS & Commerce',
    description: 'Retail-ready point of sale with products, shifts, and reports.',
    accent: 'blue',
  },
  {
    Icon: BarChartOutlined,
    title: 'Analytics & Ledger',
    description: 'Financial visibility with dashboards, ledger, and business reporting.',
    accent: 'green',
  },
]

const accentStyles = {
  blue: {
    card: 'border-blue-200/70 bg-gradient-to-br from-blue-50/90 to-white hover:border-blue-300',
    icon: 'bg-blue-600 text-white',
  },
  green: {
    card: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300',
    icon: 'bg-emerald-600 text-white',
  },
}

export function ProductCrmOverviewSection() {
  return (
    <section
      id="overview"
      className="bg-gradient-to-b from-white to-blue-50/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Product Overview
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            One Platform for CRM &amp; Operations
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            BizTrack connects customer relationships, sales, projects, and inventory so your team
            works from a single trusted system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const styles = accentStyles[mod.accent]
            return (
              <div
                key={mod.title}
                className={cn(
                  'rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md',
                  styles.card,
                )}
              >
                <div className="p-6 pb-2">
                  <div
                    className={cn(
                      'mb-3 flex h-11 w-11 items-center justify-center rounded-xl',
                      styles.icon,
                    )}
                  >
                    <mod.Icon className="text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-sm leading-relaxed text-slate-600">{mod.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
