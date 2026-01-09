import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  CommerceStackParamList,
  HealthcareStackParamList,
  WorkshopStackParamList,
  DrawerParamList,
} from './types';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CommerceStack = createStackNavigator<CommerceStackParamList>();
const HealthcareStack = createStackNavigator<HealthcareStackParamList>();
const WorkshopStack = createStackNavigator<WorkshopStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function CommerceNavigator() {
  return (
    <CommerceStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <CommerceStack.Screen
        name="CommerceHome"
        component={CommercePlaceholder}
        options={{ title: 'Commerce' }}
      />
      <CommerceStack.Screen
        name="CRM"
        component={PlaceholderScreen}
        options={{ title: 'CRM' }}
      />
      <CommerceStack.Screen
        name="Sales"
        component={PlaceholderScreen}
        options={{ title: 'Sales' }}
      />
      <CommerceStack.Screen
        name="POS"
        component={PlaceholderScreen}
        options={{ title: 'POS' }}
      />
      <CommerceStack.Screen
        name="Inventory"
        component={PlaceholderScreen}
        options={{ title: 'Inventory' }}
      />
    </CommerceStack.Navigator>
  );
}

function HealthcareNavigator() {
  return (
    <HealthcareStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <HealthcareStack.Screen
        name="HealthcareHome"
        component={HealthcarePlaceholder}
        options={{ title: 'Healthcare' }}
      />
      <HealthcareStack.Screen
        name="Patients"
        component={PlaceholderScreen}
        options={{ title: 'Patients' }}
      />
      <HealthcareStack.Screen
        name="Appointments"
        component={PlaceholderScreen}
        options={{ title: 'Appointments' }}
      />
      <HealthcareStack.Screen
        name="MedicalRecords"
        component={PlaceholderScreen}
        options={{ title: 'Medical Records' }}
      />
      <HealthcareStack.Screen
        name="MedicalSupplies"
        component={PlaceholderScreen}
        options={{ title: 'Medical Supplies' }}
      />
      <HealthcareStack.Screen
        name="Consultations"
        component={PlaceholderScreen}
        options={{ title: 'Consultations' }}
      />
      <HealthcareStack.Screen
        name="LabReports"
        component={PlaceholderScreen}
        options={{ title: 'Lab Reports' }}
      />
    </HealthcareStack.Navigator>
  );
}

function WorkshopNavigator() {
  return (
    <WorkshopStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <WorkshopStack.Screen
        name="WorkshopHome"
        component={WorkshopPlaceholder}
        options={{ title: 'Workshop' }}
      />
      <WorkshopStack.Screen
        name="WorkOrders"
        component={PlaceholderScreen}
        options={{ title: 'Work Orders' }}
      />
      <WorkshopStack.Screen
        name="Production"
        component={PlaceholderScreen}
        options={{ title: 'Production' }}
      />
      <WorkshopStack.Screen
        name="QualityControl"
        component={PlaceholderScreen}
        options={{ title: 'Quality Control' }}
      />
      <WorkshopStack.Screen
        name="Maintenance"
        component={PlaceholderScreen}
        options={{ title: 'Maintenance' }}
      />
    </WorkshopStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.default,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
        },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Commerce"
        component={CommerceNavigator}
        options={{
          tabBarLabel: 'Commerce',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Healthcare"
        component={HealthcareNavigator}
        options={{
          tabBarLabel: 'Healthcare',
          tabBarIcon: ({ color, size }) => (
            <Icon name="medical-bag" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Workshop"
        component={WorkshopNavigator}
        options={{
          tabBarLabel: 'Workshop',
          tabBarIcon: ({ color, size }) => (
            <Icon name="build" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
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
        headerStyle: {
          backgroundColor: colors.primary.main,
        },
        headerTintColor: '#fff',
        drawerActiveTintColor: colors.primary.main,
        drawerInactiveTintColor: colors.text.secondary,
        drawerStyle: {
          backgroundColor: colors.background.default,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={PlaceholderScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={PlaceholderScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Icon name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
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
      <AuthStack.Screen name="Login" component={PlaceholderScreen} />
      <AuthStack.Screen name="Register" component={PlaceholderScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={PlaceholderScreen}
      />
    </AuthStack.Navigator>
  );
}

function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

function CommercePlaceholder() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

function HealthcarePlaceholder() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

function WorkshopPlaceholder() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    'shopping-cart': 'cart',
    'medical-bag': 'medical',
    build: 'construct',
    person: 'person',
    settings: 'settings',
    notifications: 'notifications',
  };
  return <Ionicons name={iconMap[name] || 'help'} size={size} color={color} />;
}

export function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  const linking = {
    prefixes: ['biztrack://', 'https://biztrack.app'],
    config: {
      screens: {
        Auth: {
          path: '',
          screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
          },
        },
        Main: {
          path: '',
          screens: {
            Dashboard: 'dashboard',
            Commerce: {
              path: 'commerce',
              screens: {
                CommerceHome: '',
                CRM: 'crm',
                Sales: 'sales',
                POS: 'pos',
                Inventory: 'inventory',
              },
            },
            Healthcare: {
              path: 'healthcare',
              screens: {
                HealthcareHome: '',
                Patients: 'patients',
                Appointments: 'appointments',
                MedicalRecords: 'medical-records',
                MedicalSupplies: 'medical-supplies',
                Consultations: 'consultations',
                LabReports: 'lab-reports',
              },
            },
            Workshop: {
              path: 'workshop',
              screens: {
                WorkshopHome: '',
                WorkOrders: 'work-orders',
                Production: 'production',
                QualityControl: 'quality-control',
                Maintenance: 'maintenance',
              },
            },
            Profile: 'profile',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
});
