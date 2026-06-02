import {
  CheckCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FundProjectionScreenOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Statistic, Tag, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Text, Title } = Typography

const AGENCY_METRICS = {
  activeClients: 34,
  activeProjects: 18,
  teamUtilization: 82,
  monthlyRevenue: 27650,
  overdueInvoices: 6,
  campaignWinRate: 68,
}

export function AgencyDashboard() {
  const plan = getPlanByType('agency')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-1">
            Agency Module
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Client delivery, campaign tracking, and team performance in one place.
          </Paragraph>
        </div>
        <Tag color="blue">Client ops</Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active clients"
              value={AGENCY_METRICS.activeClients}
              suffix={`/ ${plan?.maxProjects ?? 50}`}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Live campaigns"
              value={AGENCY_METRICS.activeProjects}
              suffix="projects"
              prefix={<FundProjectionScreenOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Monthly revenue"
              value={AGENCY_METRICS.monthlyRevenue}
              precision={0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Team utilization">
            <div className="mb-3 flex items-center justify-between">
              <Text>Billable utilization</Text>
              <Text strong>{AGENCY_METRICS.teamUtilization}%</Text>
            </div>
            <Progress percent={AGENCY_METRICS.teamUtilization} strokeColor="#2563eb" />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Capacity remaining for this sprint: {plan?.maxUsers ? plan.maxUsers - 19 : 6} seats
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Finance health">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 p-3">
              <Text>Overdue invoices</Text>
              <Tag color="error">{AGENCY_METRICS.overdueInvoices}</Tag>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <Text>Campaign win rate</Text>
              <Tag color="success">{AGENCY_METRICS.campaignWinRate}%</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Quick actions">
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<TeamOutlined />}>
              Add Client
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<FundProjectionScreenOutlined />}>
              New Campaign
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<FileDoneOutlined />}>
              Send Proposal
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<CheckCircleOutlined />}>
              Review Deliverables
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-blue-700">
          <ThunderboltOutlined />
          <Text className="!text-blue-700">Mock data demo: replace cards with live API values later.</Text>
        </div>
      </Card>
    </div>
  )
}
