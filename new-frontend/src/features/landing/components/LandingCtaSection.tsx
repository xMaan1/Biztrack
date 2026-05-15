import { ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'

type LandingCtaSectionProps = {
  onGetStarted: () => void
  onViewPricing: () => void
}

export function LandingCtaSection({ onGetStarted, onViewPricing }: LandingCtaSectionProps) {
  return (
    <section className="from-primary to-primary/80 bg-gradient-to-r px-4 py-24 text-primary-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] text-center">
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Ready to Transform Your Business?
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-xl opacity-90">
          Join thousands of companies already using BizTrack to streamline their operations and
          boost productivity
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="large"
            className="!h-auto !border-0 !bg-white !px-8 !py-6 !text-lg !text-primary hover:!bg-white/90"
            onClick={onGetStarted}
          >
            Get Started Today
            <ArrowRightOutlined className="mx-2" />
          </Button>
          <Button
            size="large"
            className="!text-primary-foreground !h-auto !border-primary-foreground !bg-transparent !px-8 !py-6 !text-lg hover:!bg-primary-foreground hover:!text-primary"
            onClick={onViewPricing}
          >
            View Pricing
          </Button>
        </div>
      </div>
    </section>
  )
}
