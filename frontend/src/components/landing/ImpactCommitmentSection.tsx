'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Heart, Leaf, Recycle, FileX2, ArrowRight } from 'lucide-react';

const CHARITY_PARTNERS = [
  {
    name: 'Hopeful Welfare Foundation',
    href: 'https://hopefulwelfare.org/',
    logo: '/partners/hopeful-welfare-foundation.png',
    width: 180,
    height: 183,
    logoClassName: 'h-16 w-auto max-w-[180px] object-contain',
    tileClassName:
      'bg-gradient-to-br from-sky-50 to-sky-100/90 border-sky-200/80',
  },
  {
    name: 'IKCA',
    fullName: 'Imran Khan Cancer Appeal',
    href: 'https://www.ikca.org.uk/',
    logo: '/partners/ikca.png',
    width: 161,
    height: 78,
    logoClassName: 'h-14 w-auto max-w-[200px] object-contain',
    tileClassName: 'bg-background',
  },
] as const;

const SUSTAINABILITY_ITEMS = [
  {
    title: 'Carbon neutrality',
    description:
      'Supporting initiatives that reduce emissions and move toward net-zero impact.',
    icon: Leaf,
  },
  {
    title: 'Sustainable operations',
    description:
      'Responsible resource use across our teams, partners, and day-to-day operations.',
    icon: Recycle,
  },
  {
    title: 'Digital-first processes',
    description:
      'Paperless workflows that cut waste while keeping business operations efficient.',
    icon: FileX2,
  },
] as const;

export function ImpactCommitmentSection() {
  return (
    <section
      id="csr"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/40 to-blue-50/30"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            CSR — Charity &amp; Environment
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Our Commitment to Impact
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beyond business software, we invest in communities and responsible
            practices that create lasting positive change.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Heart className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">Charity Contribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                We contribute 5% of our profits to charitable causes, supporting
                education, welfare, and community development through our
                partner organizations.
              </p>

              <div>
                <p className="text-sm font-medium text-foreground mb-4">
                  Partner organizations we support
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center sm:justify-start">
                  {CHARITY_PARTNERS.map((partner) => (
                    <Link
                      key={partner.name}
                      href={partner.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-2 rounded-xl border border-border/60 px-5 py-4 transition-colors hover:border-primary/40 hover:shadow-sm ${partner.tileClassName}`}
                    >
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={partner.width}
                        height={partner.height}
                        className={partner.logoClassName}
                      />
                      <span className="text-xs font-medium text-muted-foreground text-center">
                        {'fullName' in partner && partner.fullName
                          ? partner.fullName
                          : partner.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="sustainability"
            className="border-0 bg-card/80 backdrop-blur-sm shadow-md overflow-hidden"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">
                  Carbon Footprint Commitment
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-semibold text-foreground leading-snug">
                We actively support carbon footprint reduction initiatives
              </p>

              <ul className="space-y-4">
                {SUSTAINABILITY_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <a href="#sustainability">
                  Learn about our sustainability approach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
