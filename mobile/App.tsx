import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from './src/services/ApiService';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NetworkSyncProvider } from './src/contexts/NetworkSyncContext';
import { RBACProvider } from './src/contexts/RBACContext';
import { SidebarDrawerProvider } from './src/contexts/SidebarDrawerContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { CommerceDashboardScreen } from './src/screens/CommerceDashboardScreen';

function RootBody() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-slate-600">Loading…</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <RBACProvider>
      <SidebarDrawerProvider>
        <CommerceDashboardScreen />
      </SidebarDrawerProvider>
    </RBACProvider>
  );
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await apiService.hydrate();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar style="dark" />
        {!hydrated ? (
          <View className="flex-1 items-center justify-center bg-slate-50">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-slate-600">Starting…</Text>
          </View>
        ) : (
          <NetworkSyncProvider>
            <AuthProvider>
              <RootBody />
            </AuthProvider>
          </NetworkSyncProvider>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
