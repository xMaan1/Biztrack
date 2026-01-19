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
  CRMDashboard: undefined;
  CustomerList: undefined;
  CustomerDetail: { id: string };
  CustomerForm: { id?: string; customer?: any };
  LeadList: undefined;
  LeadDetail: { id: string };
  LeadForm: { id?: string; lead?: any };
  OpportunityList: undefined;
  OpportunityDetail: { id: string };
  OpportunityForm: { id?: string; opportunity?: any };
  ContactList: undefined;
  ContactDetail: { id: string };
  ContactForm: { id?: string; contact?: any };
  CompanyList: undefined;
  CompanyDetail: { id: string };
  CompanyForm: { id?: string; company?: any };
  Sales: undefined;
  SalesDashboard: undefined;
  QuoteList: undefined;
  QuoteDetail: { id: string };
  QuoteForm: { id?: string; quote?: any };
  ContractList: undefined;
  ContractDetail: { id: string };
  ContractForm: { id?: string; contract?: any };
  InvoiceList: undefined;
  InvoiceDetail: { id: string };
  InvoiceForm: { id?: string; invoice?: any };
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
  InventoryProductList: undefined;
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
  InventoryAlerts: undefined;
  CustomerReturns: undefined;
  SupplierReturns: undefined;
  Dumps: undefined;
  Invoicing: undefined;
};

export type HealthcareStackParamList = {
  HealthcareHome: undefined;
  Patients: undefined;
  PatientList: undefined;
  PatientDetail: { id: string };
  PatientForm: { id?: string; patient?: any };
  Appointments: undefined;
  AppointmentList: undefined;
  AppointmentDetail: { id: string };
  AppointmentForm: { id?: string; appointment?: any };
  MedicalRecords: undefined;
  MedicalRecordList: undefined;
  MedicalRecordDetail: { id: string };
  MedicalRecordForm: { id?: string; record?: any };
  MedicalSupplies: undefined;
  SupplyList: undefined;
  SupplyDetail: { id: string };
  SupplyForm: { id?: string; supply?: any };
  Consultations: undefined;
  ConsultationList: undefined;
  ConsultationDetail: { id: string };
  ConsultationForm: { id?: string; consultation?: any };
  LabReports: undefined;
  LabReportList: undefined;
  LabReportDetail: { id: string };
  Invoicing: undefined;
  InvoiceDetail: { id: string };
  InvoiceForm: { id?: string; invoice?: any };
};

export type WorkshopStackParamList = {
  WorkshopHome: undefined;
  WorkOrders: undefined;
  WorkOrderList: undefined;
  WorkOrderDetail: { id: string };
  WorkOrderForm: { id?: string; workOrder?: any };
  Production: undefined;
  QualityControl: undefined;
  Maintenance: undefined;
  CustomerList: undefined;
  CustomerDetail: { id: string };
  CustomerForm: { id?: string; customer?: any };
  Invoicing: undefined;
  InvoiceDetail: { id: string };
  InvoiceForm: { id?: string; invoice?: any };
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
