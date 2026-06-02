export type PlanType = 'agency' | 'healthcare' | 'commerce' | 'workshop' | 'ngo'

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

const COMMERCE_FEATURES = [
  'Inventory Management',
  'Point of Sale (POS)',
  'Customer Relationship Management (CRM)',
  'Sales & Invoicing',
  'Purchase Orders',
  'Warehouse Management',
  'Financial Reports',
  'Multi-location Support',
  'E-commerce Integration',
  'Barcode Scanning',
  'Customer Portal',
  'Email Marketing',
]

const NGO_FEATURES = [
  'Donor Management',
  'Grant Tracking',
  'Program & Beneficiary Management',
  'Volunteer Management',
  'Campaign & Event Planning',
  'Budgeting & Fund Accounting',
  'Impact Reporting',
  'Multi-branch Coordination',
  'Document Management',
  'SMS & Email Outreach',
  'Partner Collaboration Portal',
  'Compliance & Audit Trails',
]

export const LANDING_PLANS: Plan[] = [
  {
    id: 'agency',
    name: 'Agency Pro',
    planType: 'agency',
    price: 99.99,
    maxProjects: 50,
    maxUsers: 25,
    description: 'CRM, sales, POS, and operations for agencies and client-service teams',
    features: COMMERCE_FEATURES,
  },
  {
    id: 'commerce',
    name: 'Commerce Pro',
    planType: 'commerce',
    price: 99.99,
    maxProjects: 50,
    maxUsers: 25,
    description: 'Complete ERP solution for retail, e-commerce, and distribution businesses',
    features: COMMERCE_FEATURES,
  },
  {
    id: 'workshop',
    name: 'Workshop Master',
    planType: 'workshop',
    price: 149.99,
    maxProjects: 100,
    maxUsers: 50,
    description: 'Manufacturing and production management for workshops and factories',
    features: [
      'Project Management',
      'Production Planning',
      'Work Order Management',
      'Quality Control',
      'Equipment Maintenance',
      'Inventory Management',
      'Time Tracking',
      'Resource Allocation',
      'Cost Analysis',
      'Supplier Management',
      'Workforce Management',
      'Safety Compliance',
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare Suite',
    planType: 'healthcare',
    price: 199.99,
    maxProjects: 200,
    maxUsers: 100,
    description: 'Comprehensive healthcare management for clinics, hospitals, and medical practices',
    features: [
      'Patient Management',
      'Appointment Scheduling',
      'Electronic Health Records (EHR)',
      'Billing & Insurance',
      'Inventory Management',
      'Staff Management',
      'Compliance & HIPAA',
      'Reporting & Analytics',
      'Telemedicine Support',
      'Lab Management',
      'Pharmacy Integration',
      'Medical Device Tracking',
    ],
  },
  {
    id: 'ngo',
    name: 'NGO Impact',
    planType: 'ngo',
    price: 79.99,
    maxProjects: 80,
    maxUsers: 40,
    description: 'Purpose-built operations for non-profits managing programs, donors, and impact',
    features: NGO_FEATURES,
  },
]
