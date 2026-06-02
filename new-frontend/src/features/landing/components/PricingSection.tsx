import { CheckOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router-dom'
import { LANDING_PLANS } from '../constants/plans'
import { trialRegisterPath } from '../utils/plan'

export function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-50/80 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Pricing
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Start free and scale as you grow. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-4">
          {LANDING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${
                plan.planType === 'agency'
                  ? 'border-blue-400 ring-2 ring-blue-200/60 lg:scale-[1.02]'
                  : 'border-slate-200 hover:border-blue-200'
              }`}
            >
              {plan.planType === 'agency' ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm">
                    Most Popular
                  </span>
                </div>
              ) : null}

              <div className="pb-4 pt-8 text-center">
                <h3 className="text-2xl font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-2 text-4xl font-bold text-slate-900">
                  ${plan.price}
                  <span className="text-lg font-normal text-slate-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>

              <div className="space-y-6 px-6 pb-8">
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
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckOutlined className="mt-0.5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={trialRegisterPath(plan.planType)}>
                  <Button type="primary" block className="!bg-blue-600 hover:!bg-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
