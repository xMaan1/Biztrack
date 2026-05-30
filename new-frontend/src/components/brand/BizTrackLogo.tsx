import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const LOGO_ASPECT = 671 / 503

const HEIGHTS = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 96,
} as const

type BizTrackLogoSize = keyof typeof HEIGHTS

type BizTrackLogoProps = {
  size?: BizTrackLogoSize
  variant?: 'full' | 'icon'
  showText?: boolean
  className?: string
  href?: string
}

export function BizTrackLogo({
  size = 'md',
  variant = 'full',
  showText = false,
  className,
  href,
}: BizTrackLogoProps) {
  const height = HEIGHTS[size]
  const src = variant === 'icon' ? '/biztrack-icon.png' : '/biztrack-logo.png'
  const width = variant === 'icon' ? height : Math.round(height * LOGO_ASPECT)

  const image = (
    <img
      src={src}
      alt="BizTrack"
      height={height}
      width={width}
      className="object-contain"
      fetchPriority={size === 'hero' ? 'high' : undefined}
    />
  )

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {image}
      {showText ? <span className="text-xl font-bold tracking-tight text-slate-900">BizTrack</span> : null}
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="inline-flex shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
