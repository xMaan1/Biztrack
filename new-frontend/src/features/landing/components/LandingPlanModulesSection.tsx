import {
  BankOutlined,
  GlobalOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ComponentType } from 'react'
import { cn } from '../../../lib/utils'

const PLAN_MODULES: {
  Icon: ComponentType<{ className?: string }>
  title: string
  planType: string
  description: string
  accent: 'indigo' | 'emerald' | 'orange' | 'rose' | 'cyan'
}[] = [
  {
    Icon: BankOutlined,
    title: 'Agency Module',
    planType: 'agency',
    description: 'CRM, sales, POS, and inventory for agencies managing clients and campaigns.',
    accent: 'indigo',
  },
  {
    Icon: ShoppingCartOutlined,
    title: 'Commerce Module',
    planType: 'commerce',
    description: 'Retail and distribution ERP with POS, invoicing, warehouses, and analytics.',
    accent: 'emerald',
  },
  {
    Icon: ToolOutlined,
    title: 'Workshop Module',
    planType: 'workshop',
    description: 'Production, work orders, job cards, quality control, and maintenance.',
    accent: 'orange',
  },
  {
    Icon: HeartOutlined,
    title: 'Healthcare Module',
    planType: 'healthcare',
    description: 'Patients, appointments, prescriptions, admissions, and clinic billing.',
    accent: 'rose',
  },
  {
    Icon: GlobalOutlined,
    title: 'NGO Module',
    planType: 'ngo',
    description: 'Donors, grants, programs, volunteers, and impact reporting for non-profits.',
    accent: 'cyan',
  },
]

const accentStyles = {
  indigo: {
    card: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white hover:border-indigo-300',
    icon: 'bg-indigo-600 text-white',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  emerald: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300',
    icon: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  orange: {
    card: 'border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white hover:border-orange-300',
    icon: 'bg-orange-600 text-white',
    badge: 'bg-orange-100 text-orange-800',
  },
  rose: {
    card: 'border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white hover:border-rose-300',
    icon: 'bg-rose-600 text-white',
    badge: 'bg-rose-100 text-rose-800',
  },
  cyan: {
    card: 'border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white hover:border-cyan-300',
    icon: 'bg-cyan-600 text-white',
    badge: 'bg-cyan-100 text-cyan-800',
  },
}

export function LandingPlanModulesSection() {
  return (
    <section
      id="modules"
      className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-700">
            Five industry modules
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Pick the workspace that fits your business
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Each module is a dedicated tenant with its own navigation, dashboard, and workflows.
            Start a free trial on the plan below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-6">
          {PLAN_MODULES.map((mod, index) => {
            const styles = accentStyles[mod.accent]
            return (
              <div
                key={mod.planType}
                className={cn(
                  'rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md',
                  'md:col-span-1 lg:col-span-2',
                  PLAN_MODULES.length === 5 && index === 3 && 'lg:col-start-2',
                  PLAN_MODULES.length === 5 && index === 4 && 'lg:col-start-4',
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
                  <span
                    className={cn(
                      'mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      styles.badge,
                    )}
                  >
                    {mod.planType}
                  </span>
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
