import {
  ArrowRightOutlined,
  CloudOutlined,
  DeleteOutlined,
  HeartOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

const CHARITY_PARTNERS = [
  {
    name: 'Hopeful Welfare Foundation',
    href: 'https://hopefulwelfare.org/',
    logo: '/partners/hopeful-welfare-foundation.png',
    label: 'Hopeful Welfare Foundation',
    logoClassName: 'max-h-[5.25rem]',
    frameClassName: 'bg-gradient-to-br from-white to-slate-50',
  },
  {
    name: 'IKCA',
    href: 'https://www.ikca.org.uk/',
    logo: '/partners/ikca.png',
    label: 'Imran Khan Cancer Appeal',
    logoClassName: 'max-h-[3.25rem] max-w-[11rem]',
    frameClassName: 'bg-white',
  },
]

const SUSTAINABILITY_ITEMS = [
  {
    title: 'Carbon neutrality',
    description:
      'Supporting initiatives that reduce emissions and move toward net-zero impact.',
    Icon: CloudOutlined,
  },
  {
    title: 'Sustainable operations',
    description:
      'Responsible resource use across our teams, partners, and day-to-day operations.',
    Icon: SyncOutlined,
  },
  {
    title: 'Digital-first processes',
    description:
      'Paperless workflows that cut waste while keeping business operations efficient.',
    Icon: DeleteOutlined,
  },
] as const

function CharityPartnerCard({
  partner,
}: {
  partner: (typeof CHARITY_PARTNERS)[number]
}) {
  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-4 transition-colors hover:border-blue-300 hover:shadow-md"
    >
      <div
        className={`flex h-28 w-full items-center justify-center rounded-lg px-3 shadow-sm ring-1 ring-slate-200/90 ${partner.frameClassName}`}
      >
        <img
          src={partner.logo}
          alt={partner.name}
          className={`w-auto max-w-full object-contain ${partner.logoClassName}`}
        />
      </div>
      <span className="min-h-[2.5rem] text-center text-xs font-medium leading-snug text-slate-500">
        {partner.label}
      </span>
    </a>
  )
}

export function ImpactCommitmentSection() {
  return (
    <section
      id="csr"
      className="bg-gradient-to-b from-emerald-50/40 to-blue-50/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            CSR — Charity &amp; Environment
          </p>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Our Commitment to Impact
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            Beyond business software, we invest in communities and responsible practices that create
            lasting positive change.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border-0 bg-white/80 shadow-md backdrop-blur-sm">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <HeartOutlined className="text-lg" />
                </div>
                <h3 className="text-xl font-semibold">Charity Contribution</h3>
              </div>
            </div>
            <div className="space-y-6 px-6 pb-6">
              <p className="leading-relaxed text-slate-500">
                We contribute 5% of our profits to charitable causes, supporting education, welfare,
                and community development through our partner organizations.
              </p>
              <div>
                <p className="mb-4 text-sm font-medium text-slate-900">
                  Partner organizations we support
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {CHARITY_PARTNERS.map((partner) => (
                    <CharityPartnerCard key={partner.name} partner={partner} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            id="sustainability"
            className="overflow-hidden rounded-xl border-0 bg-white/80 shadow-md backdrop-blur-sm"
          >
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CloudOutlined className="text-lg" />
                </div>
                <h3 className="text-xl font-semibold">Carbon Footprint Commitment</h3>
              </div>
            </div>
            <div className="space-y-6 px-6 pb-6">
              <p className="text-lg font-semibold leading-snug text-slate-900">
                We actively support carbon footprint reduction initiatives
              </p>
              <ul className="space-y-4">
                {SUSTAINABILITY_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <item.Icon className="text-lg" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button className="w-full sm:w-auto" href="#sustainability">
                Learn about our sustainability approach
                <ArrowRightOutlined className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
