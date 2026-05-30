'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';

export type LandingPlan = {
  id: string;
  name: string;
  planType: string;
  price: number;
  maxProjects: number;
  maxUsers: number;
  features: string[];
  description: string;
};

type LandingPricingSectionProps = {
  plans: LandingPlan[];
  currencySymbol: string;
  isAuthenticated: boolean;
  onSubscribe: (plan: LandingPlan) => void;
};

export function LandingPricingSection({
  plans,
  currencySymbol,
  isAuthenticated,
  onSubscribe,
}: LandingPricingSectionProps) {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include a 14-day free
            trial.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border shadow-sm transition-all duration-300 hover:shadow-lg ${
                  plan.planType === 'enterprise'
                    ? 'border-blue-400 ring-2 ring-blue-200/60 lg:scale-[1.02]'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                {plan.planType === 'enterprise' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1.5">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-2xl text-slate-900">
                    {plan.name}
                  </CardTitle>
                  <div className="text-4xl font-bold text-slate-900 mt-2">
                    {currencySymbol}
                    {plan.price}
                    <span className="text-lg font-normal text-slate-500">
                      /month
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6 pb-8">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projects</span>
                      <span className="font-medium">{plan.maxProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Team members</span>
                      <span className="font-medium">{plan.maxUsers}</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => onSubscribe(plan)}
                  >
                    {isAuthenticated ? 'Create Workspace' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
