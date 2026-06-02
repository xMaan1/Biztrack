import { Alert, Button, Form, Input, Typography } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { AuthLayout } from '../../auth/components/AuthLayout'
import { useAuth } from '../../auth/AuthContext'
import { getPlanByType, isPlanType } from '../../landing/utils/plan'
import { setupTenantRequest } from '../../tenants/api'
import type { PlanType } from '../../auth/types'

const { Text } = Typography

export function TenantSetupPage() {
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')
  const planType = (isPlanType(planParam) ? planParam : 'commerce') as PlanType
  const plan = getPlanByType(planType)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: { name: string }) => {
    setSubmitting(true)
    setError('')
    try {
      await setupTenantRequest({ name: values.name, plan_type: planType })
      await refreshUser()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Name your workspace"
      subtitle="One last step before your free trial begins"
      footer={
        <Text type="secondary" className="text-sm">
          Selected plan: <strong className="text-foreground">{plan?.name ?? planType}</strong>
        </Text>
      }
    >
      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="Company / workspace name"
          name="name"
          rules={[
            { required: true, message: 'Workspace name is required' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
        >
          <Input size="large" placeholder="Acme Inc." />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Start free trial
        </Button>
      </Form>
      <div className="mt-4 text-center">
        <Link to={`/register?plan=${planType}`} className="text-primary text-sm font-medium">
          Back to account details
        </Link>
      </div>
    </AuthLayout>
  )
}
