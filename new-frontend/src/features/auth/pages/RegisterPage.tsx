import { Alert, Button, Form, Input, Typography } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { getPlanByType, isPlanType } from '../../landing/utils/plan'
import type { RegisterRequest } from '../types'

const { Text } = Typography

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')
  const plan = getPlanByType(planParam)
  const planType = isPlanType(planParam) ? planParam : 'commerce'

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: RegisterRequest) => {
    setSubmitting(true)
    setError('')
    try {
      await register(values)
      navigate(`/onboarding/tenant?plan=${planType}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        plan
          ? `Start your ${plan.name} free trial — step 1 of 2`
          : 'Start managing your business with BizTrack'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {plan ? (
        <div className="border-border bg-muted/40 mb-4 rounded-lg border px-4 py-3 text-center">
          <Text type="secondary" className="text-sm">
            Plan: <strong className="text-foreground">{plan.name}</strong> · ${plan.price}/mo after trial
          </Text>
        </div>
      ) : null}
      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Username is required' },
            { min: 2, message: 'Username must be at least 2 characters' },
          ]}
        >
          <Input size="large" placeholder="johndoe" autoComplete="username" />
        </Form.Item>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <Form.Item label="First name" name="first_name">
            <Input size="large" placeholder="John" autoComplete="given-name" />
          </Form.Item>
          <Form.Item label="Last name" name="last_name">
            <Input size="large" placeholder="Doe" autoComplete="family-name" />
          </Form.Item>
        </div>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input size="large" placeholder="you@company.com" autoComplete="email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Password is required' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password size="large" placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Continue
        </Button>
      </Form>
    </AuthLayout>
  )
}
