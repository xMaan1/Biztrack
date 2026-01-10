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
  More: undefined;
};

export type CommerceStackParamList = {
  CommerceHome: undefined;
  CRM: undefined;
  CustomerList: undefined;
  CustomerDetail: { id: string };
  CustomerForm: { id?: string; customer?: any };
  LeadList: undefined;
  OpportunityList: undefined;
  OpportunityForm: { id?: string; opportunity?: any };
  ContactList: undefined;
  CompanyList: undefined;
  CompanyForm: { id?: string; company?: any };
  Sales: undefined;
  QuoteList: undefined;
  QuoteDetail: { id: string };
  QuoteForm: { id?: string; quote?: any };
  ContractList: undefined;
  ContractDetail: { id: string };
  InvoiceList: undefined;
  InvoiceDetail: { id: string };
  Analytics: undefined;
  POS: undefined;
  POSDashboard: undefined;
  POSSale: undefined;
  ProductList: undefined;
  ProductDetail: { id: string };
  ProductForm: { id?: string; product?: any };
  TransactionList: undefined;
  TransactionDetail: { id: string };
  ShiftList: undefined;
  ShiftDetail: { id: string };
  Reports: undefined;
  Inventory: undefined;
  InventoryDashboard: undefined;
  WarehouseList: undefined;
  WarehouseDetail: { id: string };
  WarehouseForm: { id?: string; warehouse?: any };
  StorageLocationList: undefined;
  StorageLocationDetail: { id: string };
  StorageLocationForm: { id?: string; storageLocation?: any };
  StockMovementList: undefined;
  StockMovementDetail: { id: string };
  StockMovementForm: { id?: string; movement?: any };
  PurchaseOrderList: undefined;
  PurchaseOrderDetail: { id: string };
  PurchaseOrderForm: { id?: string; order?: any };
  ReceivingList: undefined;
  ReceivingDetail: { id: string };
  ReceivingForm: { id?: string; receiving?: any };
  Invoicing: undefined;
};

export type HealthcareStackParamList = {
  HealthcareHome: undefined;
  Patients: undefined;
  Appointments: undefined;
  MedicalRecords: undefined;
  MedicalSupplies: undefined;
  Consultations: undefined;
  LabReports: undefined;
  Invoicing: undefined;
};

export type WorkshopStackParamList = {
  WorkshopHome: undefined;
  WorkOrders: undefined;
  Production: undefined;
  QualityControl: undefined;
  Maintenance: undefined;
  CustomerList: undefined;
  Invoicing: undefined;
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
