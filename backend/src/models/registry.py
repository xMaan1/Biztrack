def register_all_models():
    from .platform import (
        PasswordResetToken,
        Plan,
        Subscription,
        Tenant,
        User,
        project_team_members,
    )
    from .rbac import Role, TenantUser

    from .projects import Project, Task
    from .crm import Lead, Contact, Company, Opportunity, SalesActivity, Customer, CustomerGuarantor
    from ..config.sales_models import Quote, Contract
    from ..config.hrm_models import (
        Employee,
        JobPosting,
        PerformanceReview,
        TimeEntry,
        LeaveRequest,
        Payroll,
        Benefits,
        Training,
        TrainingEnrollment,
        Application,
        Supplier,
    )
    from ..config.notification_models import Notification, NotificationPreference, MobilePushDevice
    from ..config.inventory_models import (
        Product,
        Warehouse,
        PurchaseOrder,
        Receiving,
        StorageLocation,
        StockMovement,
    )
    from ..config.workshop_models import WorkOrder, WorkOrderTask
    from ..config.job_card_models import JobCard
    from ..config.vehicle_models import Vehicle
    from ..config.production_models import ProductionPlan, ProductionStep, ProductionSchedule
    from ..models.invoices import Invoice, Payment, DeliveryNote, InvoiceShareLink
    from ..config.installment_models import InstallmentPlan, Installment
    from ..config.invoice_customization_models import InvoiceCustomization
    from ..config.ledger_models import (
        ChartOfAccounts,
        LedgerTransaction,
        JournalEntry,
        FinancialPeriod,
        Budget,
        BudgetItem,
        AccountReceivable,
    )
    from ..config.banking_models import BankAccount, BankTransaction, CashPosition
    from ..config.investment_models import Investment, EquipmentInvestment, InvestmentTransaction
    from ..models.pos import POSShift, POSTransaction, PosProductCategory
    from ..config.custom_options_models import (
        CustomEventType,
        CustomDepartment,
        CustomLeaveType,
        CustomLeadSource,
        CustomContactSource,
        CustomCompanyIndustry,
        CustomContactType,
        CustomIndustry,
    )
    from ..config.audit_models import AuditLog, Permission, CustomRole
    from ..config.event_models import Event
    from ..config.saved_reports_models import SavedReport
    from ..config.quality_control_models import (
        QualityCheck,
        QualityInspection,
        QualityDefect,
        QualityReport,
    )
    from ..config.maintenance_models import (
        MaintenanceSchedule,
        MaintenanceWorkOrder,
        MaintenanceReport,
        Equipment,
    )
    from .healthcare import (
        Doctor,
        HealthcareStaff,
        Appointment,
        Prescription,
        Patient,
        ExpenseCategory,
        DailyExpense,
        Admission,
    )
    from .ngo import Donor, DonorLead, PartnerOrganization

    _ = (
        PasswordResetToken,
        Plan,
        Role,
        Subscription,
        Tenant,
        TenantUser,
        User,
        project_team_members,
        Project,
        Task,
        Lead,
        Contact,
        Company,
        Opportunity,
        SalesActivity,
        Customer,
        CustomerGuarantor,
        Quote,
        Contract,
        Employee,
        JobPosting,
        PerformanceReview,
        TimeEntry,
        LeaveRequest,
        Payroll,
        Benefits,
        Training,
        TrainingEnrollment,
        Application,
        Supplier,
        Notification,
        NotificationPreference,
        MobilePushDevice,
        Product,
        Warehouse,
        PurchaseOrder,
        Receiving,
        StorageLocation,
        StockMovement,
        WorkOrder,
        WorkOrderTask,
        JobCard,
        Vehicle,
        ProductionPlan,
        ProductionStep,
        ProductionSchedule,
        Invoice,
        Payment,
        DeliveryNote,
        InvoiceShareLink,
        InstallmentPlan,
        Installment,
        InvoiceCustomization,
        ChartOfAccounts,
        LedgerTransaction,
        JournalEntry,
        FinancialPeriod,
        Budget,
        BudgetItem,
        AccountReceivable,
        BankAccount,
        BankTransaction,
        CashPosition,
        Investment,
        EquipmentInvestment,
        InvestmentTransaction,
        POSShift,
        POSTransaction,
        PosProductCategory,
        CustomEventType,
        CustomDepartment,
        CustomLeaveType,
        CustomLeadSource,
        CustomContactSource,
        CustomCompanyIndustry,
        CustomContactType,
        CustomIndustry,
        AuditLog,
        Permission,
        CustomRole,
        Event,
        SavedReport,
        QualityCheck,
        QualityInspection,
        QualityDefect,
        QualityReport,
        MaintenanceSchedule,
        MaintenanceWorkOrder,
        MaintenanceReport,
        Equipment,
        Doctor,
        HealthcareStaff,
        Appointment,
        Prescription,
        Patient,
        ExpenseCategory,
        DailyExpense,
        Admission,
        Donor,
        DonorLead,
        PartnerOrganization,
    )
