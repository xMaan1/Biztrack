import type { ComponentType } from 'react'
import {
  BarChartOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

export type FeatureCardItem = {
  title: string
  description: string
  Icon: ComponentType<{ className?: string }>
}

export const LANDING_FEATURE_CARDS: FeatureCardItem[] = [
  {
    Icon: FolderOpenOutlined,
    title: 'Project Management',
    description:
      'Plan, track, and manage projects with ease. Set milestones, assign tasks, and monitor progress in real-time.',
  },
  {
    Icon: TeamOutlined,
    title: 'Team Collaboration',
    description:
      'Work together seamlessly with team chat, file sharing, and real-time collaboration tools.',
  },
  {
    Icon: BarChartOutlined,
    title: 'Advanced Analytics',
    description:
      'Get insights into your business performance with comprehensive dashboards and reports.',
  },
  {
    Icon: SafetyOutlined,
    title: 'Enterprise Security',
    description:
      'Bank-level security with role-based access control, audit logs, and data encryption.',
  },
  {
    Icon: ThunderboltOutlined,
    title: 'Automation',
    description:
      'Automate repetitive tasks and workflows to boost productivity and reduce errors.',
  },
  {
    Icon: GlobalOutlined,
    title: 'Multi-tenant',
    description:
      'Scale your business with our robust multi-tenant architecture designed for growth.',
  },
]
