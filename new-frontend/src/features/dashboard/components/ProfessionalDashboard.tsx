import { Card, Col, Progress, Row, Statistic, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Title } = Typography

export function ProfessionalDashboard() {
  const plan = getPlanByType('professional')

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Professional workspace
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          HR, inventory, and advanced analytics for growing businesses.
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Projects" value={14} suffix={`/ ${plan?.maxProjects ?? 25}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Team members" value={28} suffix={`/ ${plan?.maxUsers ?? 50}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Monthly revenue" value={84200} prefix="$" />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Inventory health">
            <Progress percent={72} status="active" />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Stock levels across 4 warehouses
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="HR snapshot">
            <Statistic title="Active employees" value={28} />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Payroll run scheduled this week
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
