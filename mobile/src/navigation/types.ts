export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Commerce: undefined;
  Healthcare: undefined;
  Workshop: undefined;
  Profile: undefined;
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
  MedicalSupplies: undefined;
  Consultations: undefined;
  LabReports: undefined;
};

export type WorkshopStackParamList = {
  WorkshopHome: undefined;
  WorkOrders: undefined;
  Production: undefined;
  QualityControl: undefined;
  Maintenance: undefined;
};

export type DrawerParamList = {
  MainTabs: undefined;
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
