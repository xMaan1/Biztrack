import { BuildOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router-dom'
import { trialRegisterPath } from '../utils/plan'

export function LandingNav() {
  return (
    <nav className="border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <BuildOutlined className="text-primary text-3xl" />
            <span className="text-foreground text-xl font-bold">BizTrack</span>
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            <a
              href="#features"
              className="text-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="text-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button type="text">Sign in</Button>
            </Link>
            <Link to={trialRegisterPath('commerce')}>
              <Button type="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
