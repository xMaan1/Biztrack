export type PlanType = 'healthcare' | 'commerce' | 'workshop'

export type Plan = {
  id: string
  name: string
  planType: PlanType
  price: number
  maxProjects: number
  maxUsers: number
  features: string[]
  description: string
}

export const LANDING_PLANS: Plan[] = [
  {
    id: 'healthcare',
    name: 'Healthcare Module',
    planType: 'healthcare',
    price: 29,
    maxProjects: 5,
    maxUsers: 10,
    description: 'Patient records, appointments, and clinical workflows',
    features: [
      'Patient management',
      'Appointment scheduling',
      'Medical records',
      'Staff directory',
      'Billing & claims',
      'Prescription tracking',
      'Lab results',
      'HIPAA-ready access controls',
    ],
  },
  {
    id: 'commerce',
    name: 'Commerce Pro',
    planType: 'commerce',
    price: 79,
    maxProjects: 25,
    maxUsers: 50,
    description: 'Inventory, sales, and retail operations in one place',
    features: [
      'Inventory management',
      'Point of sale',
      'Purchase orders',
      'Supplier management',
      'Sales analytics',
      'Multi-location stock',
      'Invoice & payments',
      'Customer CRM',
    ],
  },
  {
    id: 'workshop',
    name: 'Workshop Management',
    planType: 'workshop',
    price: 199,
    maxProjects: 100,
    maxUsers: 250,
    description: 'Job cards, production, and workshop floor control',
    features: [
      'Job card management',
      'Work order tracking',
      'Vehicle & asset registry',
      'Production scheduling',
      'Parts inventory',
      'Technician assignments',
      'Maintenance schedules',
      'Workshop reporting',
    ],
  },
]
