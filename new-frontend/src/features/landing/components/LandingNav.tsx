import { Link, useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { useAuth } from '../../auth/AuthContext'
import { BizTrackLogo } from '../../../components/brand/BizTrackLogo'

const NAV_LINKS = [
  { href: '#modules', label: 'Modules' },
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#csr', label: 'CSR' },
  { href: '#verification', label: 'Verify' },
] as const

export function LandingNav() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4 sm:h-16">
          <BizTrackLogo size="md" showText href="/" />

          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
            >
              Pricing
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Button
                size="middle"
                type="primary"
                className="!bg-blue-600 hover:!bg-blue-700"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex">
                  <Button size="middle" className="!border-slate-200">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="middle" type="primary" className="!bg-emerald-600 hover:!bg-emerald-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-600 hover:text-blue-700"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-600 hover:text-blue-700"
          >
            Pricing
          </a>
        </div>
      </div>
    </nav>
  )
}
