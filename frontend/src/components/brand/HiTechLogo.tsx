'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';

const LOGO_ASPECT = 1227 / 864;

const HEIGHTS = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 96,
} as const;

type HiTechLogoSize = keyof typeof HEIGHTS;

interface HiTechLogoProps {
  size?: HiTechLogoSize;
  variant?: 'full' | 'icon';
  showText?: boolean;
  className?: string;
  href?: string;
}

export function HiTechLogo({
  size = 'md',
  variant = 'full',
  showText = false,
  className,
  href,
}: HiTechLogoProps) {
  const height = HEIGHTS[size];
  const src = '/hitech.png';
  const width =
    variant === 'icon' ? height : Math.round(height * LOGO_ASPECT);

  const image = (
    <Image
      src={src}
      alt="HiTech"
      height={height}
      width={width}
      className="object-contain"
      priority={size === 'hero'}
    />
  );

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {image}
      {showText ? (
        <span className="text-xl font-bold tracking-tight">HiTech</span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
