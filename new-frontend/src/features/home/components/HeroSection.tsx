import { ArrowRightOutlined, StarFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { LANDING_STATS } from '../constants/stats'

type HeroSectionProps = {
  onStartFreeTrial: () => void
  onSeeHowItWorks: () => void
}

export function HeroSection({ onStartFreeTrial, onSeeHowItWorks }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="from-primary/10 via-primary/5 absolute inset-0 bg-gradient-to-r to-transparent"></div>
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="border-primary/20 bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2">
            <StarFilled className="text-lg" />
            <span className="text-sm font-medium">Trusted by 10,000+ businesses</span>
          </div>

          <h1 className="from-foreground via-foreground to-primary mb-6 bg-gradient-to-r bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            Complete Business
            <span className="block">Management Platform</span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-xl leading-relaxed lg:text-2xl">
            Streamline your business operations with our comprehensive ERP solution. Manage
            projects, sales, HR, inventory, and more from a single dashboard.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              type="primary"
              size="large"
              className="!h-auto !px-8 !py-6 !text-lg"
              onClick={onStartFreeTrial}
            >
              Start Free Trial
              <ArrowRightOutlined className="mx-2" />
            </Button>
            <Button size="large" className="!h-auto !px-8 !py-6 !text-lg" onClick={onSeeHowItWorks}>
              See How It Works
            </Button>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {LANDING_STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 flex justify-center">
                  <stat.Icon className="text-primary text-3xl" />
                </div>
                <div className="text-foreground text-2xl font-bold">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
