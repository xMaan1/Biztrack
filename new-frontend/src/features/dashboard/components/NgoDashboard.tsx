import {
  GiftOutlined,
  GlobalOutlined,
  HeartOutlined,
  ScheduleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Statistic, Tag, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Text, Title } = Typography

const NGO_METRICS = {
  activePrograms: 9,
  beneficiariesServed: 3240,
  activeDonors: 186,
  volunteerHours: 920,
  monthlyDonations: 14200,
  grantUtilization: 74,
}

export function NgoDashboard() {
  const plan = getPlanByType('ngo')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-1">
            NGO Module
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Programs, donors, grants, and volunteer operations for mission-driven teams.
          </Paragraph>
        </div>
        <Tag color="cyan">Impact focused</Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Active programs" value={NGO_METRICS.activePrograms} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Beneficiaries served" value={NGO_METRICS.beneficiariesServed} prefix={<HeartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active volunteers"
              value={42}
              suffix={`/ ${plan?.maxUsers ?? 40}`}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Donations and funding">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-cyan-50 p-3">
              <Text>Monthly donations</Text>
              <Tag color="cyan">${NGO_METRICS.monthlyDonations.toLocaleString()}</Tag>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
              <Text>Active donors</Text>
              <Tag color="purple">{NGO_METRICS.activeDonors}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Grant utilization">
            <div className="mb-3 flex items-center justify-between">
              <Text>Allocated grants used</Text>
              <Text strong>{NGO_METRICS.grantUtilization}%</Text>
            </div>
            <Progress percent={NGO_METRICS.grantUtilization} strokeColor="#0891b2" />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Volunteer hours tracked this month: {NGO_METRICS.volunteerHours}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card title="Quick actions">
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<GiftOutlined />}>
              Add Donor
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<GlobalOutlined />}>
              New Program
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<ScheduleOutlined />}>
              Plan Event
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block className="!h-16" icon={<TrophyOutlined />}>
              Impact Report
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
