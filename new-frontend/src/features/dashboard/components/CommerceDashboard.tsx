import type { ReactNode } from 'react'
import {
  AimOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  InboxOutlined,
  PlusOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Badge, Button, Card, Col, Progress, Row, Tag, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

const STATS = {
  totalSales: 84200,
  totalOrders: 436,
  averageOrderValue: 193,
  customerSatisfaction: 94,
  activeProjects: 8,
  totalTeamMembers: 28,
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string
  value: ReactNode
  subtitle: string
  icon: ReactNode
  accent: 'green' | 'blue' | 'purple' | 'orange'
}) {
  const border = {
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
  }[accent]

  const valueColor = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  }[accent]

  return (
    <Card className={`border-l-4 ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <Text type="secondary" className="text-sm">
            {title}
          </Text>
          <div className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</div>
          <Text type="secondary" className="text-xs">
            {subtitle}
          </Text>
        </div>
        <span className={valueColor}>{icon}</span>
      </div>
    </Card>
  )
}

export function CommerceDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title
            level={2}
            className="!mb-1 !bg-gradient-to-r !from-green-600 !to-blue-600 !bg-clip-text !text-transparent"
          >
            Commerce Dashboard
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Retail & e-commerce business overview
          </Paragraph>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="primary" icon={<PlusOutlined />} className="!bg-green-600 hover:!bg-green-700">
            New Project
          </Button>
          <Button icon={<ShoppingCartOutlined />} className="!border-green-600 !text-green-600">
            New Sale
          </Button>
          <Button icon={<BarChartOutlined />} className="!border-blue-600 !text-blue-600">
            Add Investment
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Sales"
            value={`$${STATS.totalSales.toLocaleString()}`}
            subtitle="This month"
            icon={<RiseOutlined className="text-lg" />}
            accent="green"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Orders"
            value={STATS.totalOrders}
            subtitle="Orders processed"
            icon={<ShoppingOutlined className="text-lg" />}
            accent="blue"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg Order Value"
            value={`$${STATS.averageOrderValue}`}
            subtitle="Per transaction"
            icon={<CreditCardOutlined className="text-lg" />}
            accent="purple"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Customer Satisfaction"
            value={`${STATS.customerSatisfaction}%`}
            subtitle="Rating score"
            icon={<AimOutlined className="text-lg" />}
            accent="orange"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="inline-flex items-center gap-2">
                <RiseOutlined className="text-green-600" />
                Sales Overview
              </span>
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <Text>Monthly growth</Text>
              <Text className="font-medium text-green-600">+12.5%</Text>
            </div>
            <Progress percent={75} strokeColor="#16a34a" showInfo={false} />

            <Row gutter={16} className="mt-6">
              <Col span={12}>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{STATS.activeProjects}</div>
                  <Text type="secondary" className="text-xs">
                    Active campaigns
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{STATS.totalTeamMembers}</div>
                  <Text type="secondary" className="text-xs">
                    Sales team
                  </Text>
                </div>
              </Col>
            </Row>

            <Button block className="mt-6 !border-green-600 !text-green-600" icon={<ArrowRightOutlined />}>
              View Sales Analytics
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="inline-flex items-center gap-2">
                <ShopOutlined className="text-blue-600" />
                Inventory & POS
              </span>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <Text>Low stock items</Text>
                <Tag color="error">5</Tag>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                <Text>Pending orders</Text>
                <Badge count={12} color="#ca8a04" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <Text>Today&apos;s sales</Text>
                <Tag color="blue">$2,450</Tag>
              </div>
            </div>

            <Button block className="mt-6 !border-blue-600 !text-blue-600" icon={<ArrowRightOutlined />}>
              Manage Inventory
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <InboxOutlined className="text-green-600" />
            Quick Actions
          </span>
        }
      >
        <Row gutter={[16, 16]}>
          {[
            { icon: <ShoppingCartOutlined className="text-xl" />, label: 'Point of Sale' },
            { icon: <TeamOutlined className="text-xl" />, label: 'Customer CRM' },
            { icon: <InboxOutlined className="text-xl" />, label: 'Inventory' },
            { icon: <BarChartOutlined className="text-xl" />, label: 'Reports' },
          ].map((action) => (
            <Col xs={12} md={6} key={action.label}>
              <Button block className="!flex !h-20 !flex-col !items-center !justify-center !gap-2">
                {action.icon}
                <span className="text-sm">{action.label}</span>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
