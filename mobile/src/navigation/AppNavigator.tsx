import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from '@/screens';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import CRMHomeScreen from '@/screens/commerce/crm/CRMHomeScreen';
import CRMDashboardScreen from '@/screens/commerce/crm/CRMDashboardScreen';
import CustomerListScreen from '@/screens/commerce/crm/CustomerListScreen';
import CustomerDetailScreen from '@/screens/commerce/crm/CustomerDetailScreen';
import CustomerFormScreen from '@/screens/commerce/crm/CustomerFormScreen';
import LeadListScreen from '@/screens/commerce/crm/LeadListScreen';
import LeadDetailScreen from '@/screens/commerce/crm/LeadDetailScreen';
import LeadFormScreen from '@/screens/commerce/crm/LeadFormScreen';
import OpportunityListScreen from '@/screens/commerce/crm/OpportunityListScreen';
import OpportunityDetailScreen from '@/screens/commerce/crm/OpportunityDetailScreen';
import OpportunityFormScreen from '@/screens/commerce/crm/OpportunityFormScreen';
import ContactListScreen from '@/screens/commerce/crm/ContactListScreen';
import ContactDetailScreen from '@/screens/commerce/crm/ContactDetailScreen';
import ContactFormScreen from '@/screens/commerce/crm/ContactFormScreen';
import CompanyListScreen from '@/screens/commerce/crm/CompanyListScreen';
import CompanyDetailScreen from '@/screens/commerce/crm/CompanyDetailScreen';
import CompanyFormScreen from '@/screens/commerce/crm/CompanyFormScreen';
import SalesHomeScreen from '@/screens/commerce/sales/SalesHomeScreen';
import SalesDashboardScreen from '@/screens/commerce/sales/SalesDashboardScreen';
import QuoteListScreen from '@/screens/commerce/sales/QuoteListScreen';
import QuoteDetailScreen from '@/screens/commerce/sales/QuoteDetailScreen';
import QuoteFormScreen from '@/screens/commerce/sales/QuoteFormScreen';
import ContractListScreen from '@/screens/commerce/sales/ContractListScreen';
import ContractDetailScreen from '@/screens/commerce/sales/ContractDetailScreen';
import InvoiceListScreen from '@/screens/commerce/sales/InvoiceListScreen';
import InvoiceDetailScreen from '@/screens/commerce/sales/InvoiceDetailScreen';
import InvoiceFormScreen from '@/screens/commerce/sales/InvoiceFormScreen';
import AnalyticsScreen from '@/screens/commerce/sales/AnalyticsScreen';
import POSDashboardScreen from '@/screens/commerce/pos/POSDashboardScreen';
import POSSaleScreen from '@/screens/commerce/pos/POSSaleScreen';
import ProductListScreen from '@/screens/commerce/pos/ProductListScreen';
import ProductDetailScreen from '@/screens/commerce/pos/ProductDetailScreen';
import ProductFormScreen from '@/screens/commerce/pos/ProductFormScreen';
import TransactionListScreen from '@/screens/commerce/pos/TransactionListScreen';
import TransactionDetailScreen from '@/screens/commerce/pos/TransactionDetailScreen';
import ShiftListScreen from '@/screens/commerce/pos/ShiftListScreen';
import ShiftDetailScreen from '@/screens/commerce/pos/ShiftDetailScreen';
import ReportsScreen from '@/screens/commerce/pos/ReportsScreen';
import InventoryDashboardScreen from '@/screens/commerce/inventory/InventoryDashboardScreen';
import WarehouseListScreen from '@/screens/commerce/inventory/WarehouseListScreen';
import WarehouseDetailScreen from '@/screens/commerce/inventory/WarehouseDetailScreen';
import WarehouseFormScreen from '@/screens/commerce/inventory/WarehouseFormScreen';
import StorageLocationListScreen from '@/screens/commerce/inventory/StorageLocationListScreen';
import StorageLocationDetailScreen from '@/screens/commerce/inventory/StorageLocationDetailScreen';
import StorageLocationFormScreen from '@/screens/commerce/inventory/StorageLocationFormScreen';
import StockMovementListScreen from '@/screens/commerce/inventory/StockMovementListScreen';
import StockMovementDetailScreen from '@/screens/commerce/inventory/StockMovementDetailScreen';
import StockMovementFormScreen from '@/screens/commerce/inventory/StockMovementFormScreen';
import PurchaseOrderListScreen from '@/screens/commerce/inventory/PurchaseOrderListScreen';
import PurchaseOrderDetailScreen from '@/screens/commerce/inventory/PurchaseOrderDetailScreen';
import PurchaseOrderFormScreen from '@/screens/commerce/inventory/PurchaseOrderFormScreen';
import ReceivingListScreen from '@/screens/commerce/inventory/ReceivingListScreen';
import ReceivingDetailScreen from '@/screens/commerce/inventory/ReceivingDetailScreen';
import ReceivingFormScreen from '@/screens/commerce/inventory/ReceivingFormScreen';
import InventoryProductListScreen from '@/screens/commerce/inventory/ProductListScreen';
import AlertsScreen from '@/screens/commerce/inventory/AlertsScreen';
import CustomerReturnsScreen from '@/screens/commerce/inventory/CustomerReturnsScreen';
import SupplierReturnsScreen from '@/screens/commerce/inventory/SupplierReturnsScreen';
import DumpsScreen from '@/screens/commerce/inventory/DumpsScreen';
import { DrawerMenu } from '@/components/layout/DrawerMenu';
import PatientListScreen from '@/screens/healthcare/patients/PatientListScreen';
import PatientDetailScreen from '@/screens/healthcare/patients/PatientDetailScreen';
import PatientFormScreen from '@/screens/healthcare/patients/PatientFormScreen';
import AppointmentListScreen from '@/screens/healthcare/appointments/AppointmentListScreen';
import AppointmentDetailScreen from '@/screens/healthcare/appointments/AppointmentDetailScreen';
import AppointmentFormScreen from '@/screens/healthcare/appointments/AppointmentFormScreen';
import MedicalRecordListScreen from '@/screens/healthcare/records/MedicalRecordListScreen';
import MedicalRecordDetailScreen from '@/screens/healthcare/records/MedicalRecordDetailScreen';
import MedicalRecordFormScreen from '@/screens/healthcare/records/MedicalRecordFormScreen';
import SupplyListScreen from '@/screens/healthcare/supplies/SupplyListScreen';
import SupplyDetailScreen from '@/screens/healthcare/supplies/SupplyDetailScreen';
import SupplyFormScreen from '@/screens/healthcare/supplies/SupplyFormScreen';
import ConsultationListScreen from '@/screens/healthcare/consultations/ConsultationListScreen';
import ConsultationDetailScreen from '@/screens/healthcare/consultations/ConsultationDetailScreen';
import ConsultationFormScreen from '@/screens/healthcare/consultations/ConsultationFormScreen';
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
        component={CRMHomeScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CRMDashboard"
        component={CRMDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="LeadList"
        component={LeadListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="LeadDetail"
        component={LeadDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="LeadForm"
        component={LeadFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="OpportunityList"
        component={OpportunityListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="OpportunityDetail"
        component={OpportunityDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="OpportunityForm"
        component={OpportunityFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContactList"
        component={ContactListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CompanyList"
        component={CompanyListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CompanyDetail"
        component={CompanyDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CompanyForm"
        component={CompanyFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Sales"
        component={SalesHomeScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="SalesDashboard"
        component={SalesDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="QuoteList"
        component={QuoteListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="QuoteDetail"
        component={QuoteDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="QuoteForm"
        component={QuoteFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContractList"
        component={ContractListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContractDetail"
        component={ContractDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ContractForm"
        component={ContractFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InvoiceForm"
        component={InvoiceFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="POS"
        component={POSDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="POSDashboard"
        component={POSDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="POSSale"
        component={POSSaleScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ShiftList"
        component={ShiftListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ShiftDetail"
        component={ShiftDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Inventory"
        component={InventoryDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InventoryDashboard"
        component={InventoryDashboardScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="WarehouseList"
        component={WarehouseListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="WarehouseDetail"
        component={WarehouseDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="WarehouseForm"
        component={WarehouseFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StorageLocationList"
        component={StorageLocationListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StorageLocationDetail"
        component={StorageLocationDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StorageLocationForm"
        component={StorageLocationFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StockMovementList"
        component={StockMovementListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StockMovementDetail"
        component={StockMovementDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="StockMovementForm"
        component={StockMovementFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="PurchaseOrderList"
        component={PurchaseOrderListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="PurchaseOrderDetail"
        component={PurchaseOrderDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="PurchaseOrderForm"
        component={PurchaseOrderFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ReceivingList"
        component={ReceivingListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ReceivingDetail"
        component={ReceivingDetailScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="ReceivingForm"
        component={ReceivingFormScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InventoryProductList"
        component={InventoryProductListScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="InventoryAlerts"
        component={AlertsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="CustomerReturns"
        component={CustomerReturnsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="SupplierReturns"
        component={SupplierReturnsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Dumps"
        component={DumpsScreen}
        options={{ headerShown: false }}
      />
      <CommerceStack.Screen
        name="Invoicing"
        component={InvoiceListScreen}
        options={{ headerShown: false }}
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
        component={PatientListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="PatientList"
        component={PatientListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="PatientForm"
        component={PatientFormScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="Appointments"
        component={AppointmentListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="AppointmentList"
        component={AppointmentListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="AppointmentForm"
        component={AppointmentFormScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="MedicalRecords"
        component={MedicalRecordListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="MedicalRecordList"
        component={MedicalRecordListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="MedicalRecordDetail"
        component={MedicalRecordDetailScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="MedicalRecordForm"
        component={MedicalRecordFormScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="MedicalSupplies"
        component={SupplyListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="SupplyList"
        component={SupplyListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="SupplyDetail"
        component={SupplyDetailScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="SupplyForm"
        component={SupplyFormScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="Consultations"
        component={ConsultationListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="ConsultationList"
        component={ConsultationListScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="ConsultationDetail"
        component={ConsultationDetailScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="ConsultationForm"
        component={ConsultationFormScreen}
        options={{ headerShown: false }}
      />
      <HealthcareStack.Screen
        name="LabReports"
        component={PlaceholderScreen}
        options={{ title: 'Lab Reports' }}
      />
      <HealthcareStack.Screen
        name="Invoicing"
        component={InvoiceListScreen}
        options={{ headerShown: false }}
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
      <WorkshopStack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{ headerShown: false }}
      />
      <WorkshopStack.Screen
        name="Invoicing"
        component={InvoiceListScreen}
        options={{ headerShown: false }}
      />
    </WorkshopStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} />
      <MainTab.Screen name="Commerce" component={CommerceNavigator} />
      <MainTab.Screen name="Healthcare" component={HealthcareNavigator} />
      <MainTab.Screen name="Workshop" component={WorkshopNavigator} />
    </MainTab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerMenu {...props} />}
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
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
    'ellipsis-horizontal': 'ellipsis-horizontal',
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
