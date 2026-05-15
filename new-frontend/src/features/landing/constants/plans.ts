export type Plan = {
  id: string
  name: string
  planType: string
  price: number
  maxProjects: number
  maxUsers: number
  features: string[]
  description: string
}

export const LANDING_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    planType: 'starter',
    price: 29,
    maxProjects: 5,
    maxUsers: 10,
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 5 projects',
      '10 team members',
      'Basic reporting',
      'Email support',
      'Core CRM',
      'Mobile app access',
      'Invoice management',
      'Task tracking',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    planType: 'professional',
    price: 79,
    maxProjects: 25,
    maxUsers: 50,
    description: 'For growing businesses that need more power',
    features: [
      'Up to 25 projects',
      '50 team members',
      'Advanced analytics',
      'Priority support',
      'HR & payroll',
      'Inventory management',
      'Workflow automation',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    planType: 'enterprise',
    price: 199,
    maxProjects: 100,
    maxUsers: 250,
    description: 'Full power for larger organizations',
    features: [
      'Up to 100 projects',
      '250 team members',
      'Dedicated onboarding',
      'SSO & advanced security',
      'Custom integrations',
      'SLA & uptime guarantee',
      'Audit logs',
      'Dedicated account manager',
    ],
  },
]
