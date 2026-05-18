import { Card, Col, Row, Statistic, Tag, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Title } = Typography

export function EnterpriseDashboard() {
  const plan = getPlanByType('enterprise')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-1">
            Enterprise workspace
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            SSO, audit logs, and dedicated support for larger organizations.
          </Paragraph>
        </div>
        <Tag color="blue">Dedicated account manager</Tag>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Projects" value={42} suffix={`/ ${plan?.maxProjects ?? 100}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Team members" value={156} suffix={`/ ${plan?.maxUsers ?? 250}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Uptime SLA" value={99.9} suffix="%" precision={1} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Security & compliance">
            <Paragraph className="!mb-2 text-sm">SSO enabled · Audit logs active</Paragraph>
            <Paragraph type="secondary" className="!mb-0 text-sm">
              3 custom integrations connected
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Global operations">
            <Statistic title="Regions" value={5} />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Consolidated reporting across business units
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
