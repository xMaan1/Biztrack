import type { ComponentType } from 'react'
import {
  CheckCircleOutlined,
  FolderOpenOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons'

export type StatItem = {
  label: string
  value: string
  Icon: ComponentType<{ className?: string }>
}

export const LANDING_STATS: StatItem[] = [
  { label: 'Active Users', value: '10,000+', Icon: TeamOutlined },
  { label: 'Projects Managed', value: '50,000+', Icon: FolderOpenOutlined },
  { label: 'Uptime', value: '99.9%', Icon: CheckCircleOutlined },
  { label: 'Customer Satisfaction', value: '4.9/5', Icon: StarFilled },
]
