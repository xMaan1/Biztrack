import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'
import { BizTrackLogo } from '../../../components/brand/BizTrackLogo'

type HeroSectionProps = {
  onStartFreeTrial: () => void
  onSeeHowItWorks: () => void
}

const STATS = [
  { label: 'Active Users', value: '10,000+', Icon: TeamOutlined },
  { label: 'Projects Managed', value: '50,000+', Icon: FolderOpenOutlined },
  { label: 'Uptime', value: '99.9%', Icon: CheckCircleOutlined },
  { label: 'Customer Satisfaction', value: '4.9/5', Icon: StarFilled },
]

export function HeroSection({ onStartFreeTrial, onSeeHowItWorks }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mx-auto text-center">
          <div className="mb-6 flex justify-center sm:mb-8">
            <BizTrackLogo size="hero" />
          </div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-4 py-2 text-emerald-800">
            <StarFilled className="text-base text-emerald-600" />
            <span className="text-sm font-medium">Trusted by 10,000+ businesses</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
            Complete Business
            <span className="block bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Management Platform
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Streamline your business operations with our comprehensive ERP solution. Manage
            projects, sales, HR, inventory, and more from a single dashboard.
          </p>

          <div className="mb-10 flex flex-col justify-center gap-3 sm:mb-12 sm:flex-row sm:gap-4">
            <Button
              type="primary"
              size="large"
              className="!h-auto !border-0 !bg-blue-600 !px-8 !py-6 !text-base hover:!bg-blue-700 sm:!text-lg"
              onClick={onStartFreeTrial}
            >
              Start Free Trial
              <ArrowRightOutlined className="ml-2" />
            </Button>
            <Button
              size="large"
              className="!h-auto !border-blue-200 !px-8 !py-6 !text-base !text-blue-800 hover:!bg-blue-50 sm:!text-lg"
              onClick={onSeeHowItWorks}
            >
              See How It Works
            </Button>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-4 shadow-sm sm:p-4"
              >
                <div className="mb-2 flex justify-center">
                  <stat.Icon className="text-2xl text-blue-600 sm:text-3xl" />
                </div>
                <div className="text-xl font-bold text-slate-900 sm:text-2xl">{stat.value}</div>
                <div className="text-xs text-slate-500 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
