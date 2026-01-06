import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { RBACProvider } from '@/contexts/RBACContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AppNavigator } from '@/navigation';

export default function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </NotificationProvider>
        </CurrencyProvider>
      </RBACProvider>
    </AuthProvider>
  );
}

