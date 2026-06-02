import { Card, Col, Row, Statistic, Tag, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Title } = Typography

export function WorkshopDashboard() {
  const plan = getPlanByType('workshop')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-1">
            Workshop Management
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Job cards, production, and workshop floor control.
          </Paragraph>
        </div>
        <Tag color="blue">Production ready</Tag>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Open job cards" value={18} suffix={`/ ${plan?.maxProjects ?? 100}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Technicians" value={24} suffix={`/ ${plan?.maxUsers ?? 250}`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Vehicles in bay" value={7} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Production queue">
            <Paragraph className="!mb-2 text-sm">5 jobs scheduled today · 2 awaiting parts</Paragraph>
            <Paragraph type="secondary" className="!mb-0 text-sm">
              Average turnaround 2.4 days
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Parts inventory">
            <Statistic title="Low stock items" value={9} />
            <Paragraph type="secondary" className="!mb-0 mt-2 text-sm">
              Reorder alerts for workshop supplies
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
