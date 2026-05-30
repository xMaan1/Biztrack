import {
  BarChartOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ComponentType } from 'react'
import { cn } from '../../../lib/utils'

const FEATURES: {
  Icon: ComponentType<{ className?: string }>
  title: string
  description: string
  accent: 'blue' | 'green'
}[] = [
  {
    Icon: FolderOpenOutlined,
    title: 'Project Management',
    description:
      'Plan, track, and manage projects with ease. Set milestones, assign tasks, and monitor progress in real-time.',
    accent: 'blue',
  },
  {
    Icon: TeamOutlined,
    title: 'Team Collaboration',
    description:
      'Work together seamlessly with team chat, file sharing, and real-time collaboration tools.',
    accent: 'green',
  },
  {
    Icon: BarChartOutlined,
    title: 'Advanced Analytics',
    description:
      'Get insights into your business performance with comprehensive dashboards and reports.',
    accent: 'blue',
  },
  {
    Icon: SafetyOutlined,
    title: 'Enterprise Security',
    description:
      'Bank-level security with role-based access control, audit logs, and data encryption.',
    accent: 'green',
  },
  {
    Icon: ThunderboltOutlined,
    title: 'Automation',
    description:
      'Automate repetitive tasks and workflows to boost productivity and reduce errors.',
    accent: 'blue',
  },
  {
    Icon: GlobalOutlined,
    title: 'Multi-tenant',
    description:
      'Scale your business with our robust multi-tenant architecture designed for growth.',
    accent: 'green',
  },
]

const iconRing = {
  blue: 'bg-blue-100 text-blue-700 group-hover:bg-blue-200',
  green: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200',
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-gradient-to-b from-slate-50/80 to-emerald-50/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Powerful features designed to streamline your business operations and boost productivity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="pb-4 pt-6 text-center">
                <div
                  className={cn(
                    'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                    iconRing[feature.accent],
                  )}
                >
                  <feature.Icon className="text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              </div>
              <div className="px-6 pb-6">
                <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
