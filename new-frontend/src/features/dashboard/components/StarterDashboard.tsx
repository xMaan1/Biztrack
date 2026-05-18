import { Card, Col, Row, Statistic, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Title } = Typography

export function StarterDashboard() {
  const plan = getPlanByType('starter')

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Starter workspace
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Core CRM, tasks, and invoicing for small teams.
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Projects" value={3} suffix={`/ ${plan?.maxProjects ?? 5}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Team members" value={4} suffix={`/ ${plan?.maxUsers ?? 10}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Open invoices" value={12} />
          </Card>
        </Col>
      </Row>
      <Card title="Quick actions">
        <Paragraph className="!mb-0 text-sm">
          Add contacts, log time, and send your first invoice — starter tools are ready to explore.
        </Paragraph>
      </Card>
    </div>
  )
}
