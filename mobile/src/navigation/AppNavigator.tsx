import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList, AuthStackParamList, MainTabParamList, CommerceStackParamList, HealthcareStackParamList, WorkshopStackParamList, DrawerParamList } from './types';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CommerceStack = createStackNavigator<CommerceStackParamList>();
const HealthcareStack = createStackNavigator<HealthcareStackParamList>();
const WorkshopStack = createStackNavigator<WorkshopStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

import LoginScreen from '@/screens/auth/LoginScreen';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';

const CommerceHomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const HealthcareHomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const WorkshopHomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

function CommerceNavigator() {
  return (
    <CommerceStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <CommerceStack.Screen
        name="CommerceHome"
        component={CommerceHomeScreen}
        options={{ title: 'Commerce' }}
      />
    </CommerceStack.Navigator>
  );
}

function HealthcareNavigator() {
  return (
    <HealthcareStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <HealthcareStack.Screen
        name="HealthcareHome"
        component={HealthcareHomeScreen}
        options={{ title: 'Healthcare' }}
      />
    </HealthcareStack.Navigator>
  );
}

function WorkshopNavigator() {
  return (
    <WorkshopStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <WorkshopStack.Screen
        name="WorkshopHome"
        component={WorkshopHomeScreen}
        options={{ title: 'Workshop' }}
      />
    </WorkshopStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.muted,
        },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Commerce"
        component={CommerceNavigator}
        options={{
          tabBarLabel: 'Commerce',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Healthcare"
        component={HealthcareNavigator}
        options={{
          tabBarLabel: 'Healthcare',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Workshop"
        component={WorkshopNavigator}
        options={{
          tabBarLabel: 'Workshop',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.muted,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ title: 'Home', headerShown: false }}
      />
    </Drawer.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const linking = {
    prefixes: ['biztrack://', 'https://biztrack.app'],
    config: {
      screens: {
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
          },
        },
        Main: {
          screens: {
            Dashboard: 'dashboard',
            Commerce: {
              screens: {
                CommerceHome: 'commerce',
                CRM: 'commerce/crm',
                Sales: 'commerce/sales',
                POS: 'commerce/pos',
                Inventory: 'commerce/inventory',
              },
            },
            Healthcare: {
              screens: {
                HealthcareHome: 'healthcare',
                Patients: 'healthcare/patients',
                Appointments: 'healthcare/appointments',
                MedicalRecords: 'healthcare/records',
                Consultations: 'healthcare/consultations',
              },
            },
            Workshop: {
              screens: {
                WorkshopHome: 'workshop',
                WorkOrders: 'workshop/work-orders',
                Production: 'workshop/production',
                QualityControl: 'workshop/quality',
                Maintenance: 'workshop/maintenance',
              },
            },
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={DrawerNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

