import { CheckOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { LANDING_PLANS } from '../constants/plans'
import { trialRegisterPath } from '../utils/plan'

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">Choose Your Plan</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Start free and scale as you grow. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {LANDING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`group relative transition-all duration-300 hover:shadow-xl ${
                plan.planType === 'enterprise'
                  ? 'border-primary scale-100 border shadow-lg lg:scale-105'
                  : 'border-border hover:border-primary/50 border'
              }`}
            >
              {plan.planType === 'enterprise' ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <span className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm shadow-sm">
                    Most Popular
                  </span>
                </div>
              ) : null}

              <div className="pb-6 text-center">
                <Typography.Title level={3} className="!mb-2 !text-2xl">
                  {plan.name}
                </Typography.Title>
                <div className="text-foreground mb-2 text-4xl font-bold">
                  ${plan.price}
                  <span className="text-muted-foreground text-lg font-normal">/month</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="text-foreground font-medium">{plan.maxProjects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Team Members</span>
                    <span className="text-foreground font-medium">{plan.maxUsers}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckOutlined className="flex-shrink-0 text-green-500" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link to={trialRegisterPath(plan.planType)}>
                  <Button
                    type="primary"
                    className={`!w-full !border-0 !bg-blue-600 !text-white hover:!bg-blue-700 group-hover:scale-105 ${
                      plan.planType === 'enterprise' ? '!shadow-lg' : ''
                    }`}
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
