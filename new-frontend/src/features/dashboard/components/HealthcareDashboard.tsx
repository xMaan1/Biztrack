import { Card, Col, Row, Statistic, Typography } from 'antd'
import { getPlanByType } from '../../landing/utils/plan'

const { Paragraph, Title } = Typography

export function HealthcareDashboard() {
  const plan = getPlanByType('healthcare')

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Healthcare Module
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Patient records, appointments, and clinical workflows.
        </Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Patients" value={128} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Appointments today" value={24} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Staff on duty" value={4} suffix={`/ ${plan?.maxUsers ?? 10}`} />
          </Card>
        </Col>
      </Row>
      <Card title="Quick actions">
        <Paragraph className="!mb-0 text-sm">
          Schedule appointments, update patient records, and review lab results.
        </Paragraph>
      </Card>
    </div>
  )
}
