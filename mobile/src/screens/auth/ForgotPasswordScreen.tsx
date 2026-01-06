import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '@/services/ApiService';
import { Input } from '@/components/forms';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { Alert } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
});

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      setError('');
      setSuccess(false);
      setLoading(true);

      await apiService.post('/auth/reset-password', { email: data.email });
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#eff6ff', '#e0e7ff', '#f3e8ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                {success
                  ? 'Check your email for password reset instructions'
                  : 'Enter your email address and we\'ll send you instructions to reset your password'}
              </Text>
            </View>

            {error && (
              <Alert variant="destructive">{error}</Alert>
            )}

            {success && (
              <Alert variant="success">
                Password reset email sent! Please check your inbox.
              </Alert>
            )}

            {!success && (
              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email"
                      placeholder="Enter your email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      error={errors.email?.message}
                    />
                  )}
                />

                <Button
                  title={loading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  style={styles.button}
                />
              </View>
            )}

            <View style={styles.backContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: spacing.md,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backLink: {
    fontSize: typography.fontSize.sm,
    color: colors.light.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

