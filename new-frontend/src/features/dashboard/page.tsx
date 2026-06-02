import { BuildOutlined, LogoutOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPlanByType } from '../landing/utils/plan'
import { AgencyDashboard } from './components/AgencyDashboard'
import { CommerceDashboard } from './components/CommerceDashboard'
import { HealthcareDashboard } from './components/HealthcareDashboard'
import { NgoDashboard } from './components/NgoDashboard'
import { WorkshopDashboard } from './components/WorkshopDashboard'

const { Text, Title } = Typography

function PlanDashboard({ planType }: { planType: string | null | undefined }) {
  if (planType === 'agency') {
    return <AgencyDashboard />
  }
  if (planType === 'healthcare') {
    return <HealthcareDashboard />
  }
  if (planType === 'ngo') {
    return <NgoDashboard />
  }
  if (planType === 'workshop') {
    return <WorkshopDashboard />
  }
  return <CommerceDashboard />
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const plan = getPlanByType(user?.plan_type)

  return (
    <div className="from-background via-background to-muted/20 min-h-screen bg-gradient-to-br">
      <header className="border-border border-b bg-background/95 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-foreground inline-flex items-center gap-2">
            <BuildOutlined className="text-primary text-2xl" />
            <span className="text-lg font-bold">BizTrack</span>
          </Link>
          <Button icon={<LogoutOutlined />} onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="mb-6">
          <Title level={4} className="!mb-1">
            Welcome, {user?.first_name || user?.username}
          </Title>
          <Text type="secondary">
            {user?.tenant_name}
            {plan ? ` · ${plan.name}` : ''}
          </Text>
        </Card>
        <PlanDashboard planType={user?.plan_type} />
      </main>
    </div>
  )
}
