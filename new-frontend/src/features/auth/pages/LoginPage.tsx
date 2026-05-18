import { Alert, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { AuthLayout } from '../components/AuthLayout'

interface LoginFormValues {
  username: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true)
    setError('')
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your BizTrack account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium">
            Create one
          </Link>
        </>
      }
    >
      {error ? (
        <Alert type="error" message={error} showIcon className="mb-4" />
      ) : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="Email or username"
          name="username"
          rules={[{ required: true, message: 'Email or username is required' }]}
        >
          <Input size="large" placeholder="you@company.com" autoComplete="username" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Password is required' }]}
        >
          <Input.Password size="large" placeholder="Your password" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          Sign in
        </Button>
      </Form>
    </AuthLayout>
  )
}
