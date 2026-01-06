import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Commerce: NavigatorScreenParams<CommerceStackParamList>;
  Healthcare: NavigatorScreenParams<HealthcareStackParamList>;
  Workshop: NavigatorScreenParams<WorkshopStackParamList>;
};

export type CommerceStackParamList = {
  CommerceHome: undefined;
  CRM: undefined;
  Sales: undefined;
  POS: undefined;
  Inventory: undefined;
};

export type HealthcareStackParamList = {
  HealthcareHome: undefined;
  Patients: undefined;
  Appointments: undefined;
  MedicalRecords: undefined;
  Consultations: undefined;
};

export type WorkshopStackParamList = {
  WorkshopHome: undefined;
  WorkOrders: undefined;
  Production: undefined;
  QualityControl: undefined;
  Maintenance: undefined;
};

export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Profile: undefined;
  Settings: undefined;
  Logout: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

