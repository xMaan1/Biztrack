import { Layout, Typography } from 'antd'

const { Content } = Layout

export function HomePage() {
  return (
    <Layout className="min-h-screen bg-neutral-50">
      <Content className="mx-auto max-w-3xl p-6">
        <Typography.Title level={2} className="!mb-1">
          BizTrack
        </Typography.Title>
        <Typography.Text type="secondary" className="block">
          new-frontend
        </Typography.Text>
      </Content>
    </Layout>
  )
}
