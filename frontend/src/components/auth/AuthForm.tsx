'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { LoginCredentials, RegisterData } from '@/src/models/auth';
import { apiService } from '@/src/services/ApiService';
import { extractErrorMessage } from '@/src/utils/errorUtils';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess: () => void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const success = await login({
          email: formData.email,
          password: formData.password,
        } as LoginCredentials);

        if (success) {
          onSuccess();
        } else {
          const errorMessage = 'Invalid email or password';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const user = await apiService.register({
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        } as RegisterData);

        if (user) {
          const loginSuccess = await login({
            email: formData.email,
            password: formData.password,
          } as LoginCredentials);

          if (loginSuccess) {
            onSuccess();
          } else {
            const errorMessage = 'Registration successful but automatic login failed. Please sign in manually.';
            setError(errorMessage);
            toast.error(errorMessage);
          }
        }
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      if (err?.request && !err?.response) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === 'string') errorMessage = data.detail;
        else if (typeof data.message === 'string') errorMessage = data.message;
        else errorMessage = extractErrorMessage(err, errorMessage);
      } else {
        errorMessage = extractErrorMessage(err, errorMessage);
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md modern-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {mode === 'login'
              ? 'Sign in to your account'
              : 'Sign up to get started'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-300 bg-red-50" variant="destructive">
                <AlertDescription className="text-red-800 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full"
              />
            </div>

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="userName">Username</Label>
                  <Input
                    id="userName"
                    required
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full"
              />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <Link
                  href="/reset-password"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full modern-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
