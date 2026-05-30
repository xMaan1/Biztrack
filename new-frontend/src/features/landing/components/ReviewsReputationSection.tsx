import {
  BankOutlined,
  LeftOutlined,
  RightOutlined,
  StarFilled,
} from '@ant-design/icons'
import { Button, Tabs, Tag } from 'antd'
import { useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import {
  GOOGLE_DUMMY_REVIEWS,
  TRUSTPILOT_DUMMY_REVIEWS,
  type ReviewItem,
} from '../constants/reviewsReputation'

const TRUSTPILOT_SUMMARY = {
  rating: 4.8,
  reviewCount: 128,
  profileUrl: 'https://www.trustpilot.com/',
}

const GOOGLE_SUMMARY = {
  rating: 4.9,
  reviewCount: 89,
  profileUrl: 'https://www.google.com/maps',
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarFilled
          key={i}
          className={cn(
            sizeClass,
            i < Math.floor(rating)
              ? 'text-amber-400'
              : i < rating
                ? 'text-amber-200'
                : 'text-slate-200',
          )}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="min-w-[280px] max-w-[320px] shrink-0 snap-center rounded-xl border border-slate-200/60 bg-white/90 p-5 shadow-sm md:min-w-0 md:max-w-none">
      <div className="mb-3 flex items-center justify-between gap-2">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-xs text-slate-500">{review.date}</span>
      </div>
      <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">
        &ldquo;{review.excerpt}&rdquo;
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-900">{review.author}</p>
    </div>
  )
}

function ReviewCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 hidden gap-2 sm:flex">
        <Button
          type="default"
          shape="circle"
          icon={<LeftOutlined />}
          onClick={() => scroll('left')}
          aria-label="Previous reviews"
        />
        <Button
          type="default"
          shape="circle"
          icon={<RightOutlined />}
          onClick={() => scroll('right')}
          aria-label="Next reviews"
        />
      </div>

      <div
        ref={scrollRef}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] md:grid md:snap-none md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

function WidgetPlaceholder({
  platform,
  accentClass,
}: {
  platform: 'Trustpilot' | 'Google'
  accentClass: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center sm:p-8',
        accentClass,
      )}
    >
      <Tag>Placeholder</Tag>
      <p className="text-sm font-medium text-slate-900">{platform} widget embed</p>
      <p className="max-w-sm text-xs text-slate-500">
        Live feed or summary card will appear here once connected.
      </p>
    </div>
  )
}

function PlatformPanel({
  platform,
  rating,
  reviewCount,
  profileUrl,
  ctaLabel,
  reviews,
  widgetAccent,
  tabAccent,
}: {
  platform: 'Trustpilot' | 'Google'
  rating: number
  reviewCount: number
  profileUrl: string
  ctaLabel: string
  reviews: ReviewItem[]
  widgetAccent: string
  tabAccent: string
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className={cn('rounded-xl border-0 shadow-md', tabAccent)}>
          <div className="flex flex-col items-center p-6 text-center sm:items-start sm:p-8 sm:text-left">
            <p className="mb-2 text-sm font-medium text-slate-500">
              Overall rating on {platform}
            </p>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900">{rating.toFixed(1)}</span>
              <span className="text-lg text-slate-500">/ 5</span>
            </div>
            <StarRating rating={rating} size="lg" />
            <p className="mt-3 text-sm text-slate-500">
              Based on{' '}
              <span className="font-semibold text-slate-900">
                {reviewCount.toLocaleString()}
              </span>{' '}
              reviews
            </p>
            <Button type="primary" className="mt-6 w-full !bg-blue-600 sm:w-auto" href={profileUrl} target="_blank">
              {ctaLabel}
              <BankOutlined className="ml-2" />
            </Button>
          </div>
        </div>
        <WidgetPlaceholder platform={platform} accentClass={widgetAccent} />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Latest reviews</h3>
        <ReviewCarousel reviews={reviews} />
      </div>
    </div>
  )
}

export function ReviewsReputationSection() {
  const [activeTab, setActiveTab] = useState('trustpilot')

  return (
    <section
      id="reviews"
      className="bg-gradient-to-b from-white to-blue-50/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Reviews &amp; Reputation
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Trusted by Teams Like Yours
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            See how customers rate BizTrack on independent review platforms. Sample data shown until
            live feeds are connected.
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className="landing-reviews-tabs"
          items={[
            {
              key: 'trustpilot',
              label: 'Trustpilot',
              children: (
                <PlatformPanel
                  platform="Trustpilot"
                  rating={TRUSTPILOT_SUMMARY.rating}
                  reviewCount={TRUSTPILOT_SUMMARY.reviewCount}
                  profileUrl={TRUSTPILOT_SUMMARY.profileUrl}
                  ctaLabel="Read on Trustpilot"
                  reviews={TRUSTPILOT_DUMMY_REVIEWS}
                  widgetAccent="border-[#00b67a]/30 bg-[#00b67a]/5"
                  tabAccent="bg-gradient-to-br from-emerald-50/80 to-white"
                />
              ),
            },
            {
              key: 'google',
              label: 'Google',
              children: (
                <PlatformPanel
                  platform="Google"
                  rating={GOOGLE_SUMMARY.rating}
                  reviewCount={GOOGLE_SUMMARY.reviewCount}
                  profileUrl={GOOGLE_SUMMARY.profileUrl}
                  ctaLabel="View on Google"
                  reviews={GOOGLE_DUMMY_REVIEWS}
                  widgetAccent="border-[#4285f4]/30 bg-[#4285f4]/5"
                  tabAccent="bg-gradient-to-br from-blue-50/80 to-white"
                />
              ),
            },
          ]}
        />
      </div>
    </section>
  )
}
