import { ArrowRightOutlined, CalendarOutlined, MailOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router-dom'

type LandingCtaSectionProps = {
  onBookDemo: () => void
}

export function LandingCtaSection({ onBookDemo }: LandingCtaSectionProps) {
  return (
    <section
      id="contact"
      className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-100">
          Get Started
        </p>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Ready to See BizTrack in Action?
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-50/95">
          Book a demo or get in touch with our team. We will help you find the right setup for your
          business.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="large"
            className="!h-auto !border-0 !bg-white !px-8 !py-6 !text-base !text-blue-700 hover:!bg-blue-50 sm:!text-lg"
            onClick={onBookDemo}
          >
            <CalendarOutlined className="mr-2" />
            Book a Demo
            <ArrowRightOutlined className="ml-2" />
          </Button>
          <a href="mailto:support@biztrack.uk">
            <Button
              size="large"
              className="!h-auto !w-full !border-white/80 !bg-transparent !px-8 !py-6 !text-base !text-white hover:!bg-white/10 sm:!w-auto sm:!text-lg"
            >
              <MailOutlined className="mr-2" />
              Contact Us
            </Button>
          </a>
        </div>

        <p className="mt-8 text-sm text-blue-100/90">
          Prefer self-serve?{' '}
          <Link
            to="/register"
            className="font-semibold underline underline-offset-2 hover:text-white"
          >
            Start your free trial
          </Link>
        </p>
      </div>
    </section>
  )
}
