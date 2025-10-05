# This file imports all the split database components
# This file imports all the split database components

# Import database configuration
from .database_config import (
    engine, SessionLocal, Base, create_tables, get_db
)

# Import all models
from .core_models import (
    User, Tenant, Plan, Subscription, TenantUser, project_team_members
)

from .project_models import (
    Project, Task
)

from .crm_models import (
    Lead, Contact, Company, Opportunity, SalesActivity, Customer
)

from .sales_models import (
    Quote, Contract
)

from .hrm_models import (
    Employee, JobPosting, PerformanceReview, TimeEntry, LeaveRequest, Payroll, Benefits,
    Training, TrainingEnrollment, Application, Supplier
)

from .inventory_models import (
    Product, Warehouse, PurchaseOrder, Receiving,
    StorageLocation, StockMovement
)

from .workshop_models import (
    WorkOrder, WorkOrderTask, WorkOrderStatus, WorkOrderPriority, WorkOrderType
)

from .production_models import (
    ProductionPlan, ProductionStep, ProductionSchedule, ProductionStatus, ProductionPriority, ProductionType
)

from .invoice_models import (
    Invoice, Payment
)

from .invoice_customization_models import (
    InvoiceCustomization
)

from .ledger_models import (
    ChartOfAccounts, LedgerTransaction, JournalEntry, 
    FinancialPeriod, Budget, BudgetItem
)

from .pos_models import (
    POSShift, POSTransaction
)

from .custom_options_models import (
    CustomEventType, CustomDepartment, CustomLeaveType, CustomLeadSource,
    CustomContactSource, CustomCompanyIndustry, CustomContactType, CustomIndustry
)

from .audit_models import (
    AuditLog, Permission, CustomRole
)

# Import all CRUD functions
from .core_crud import (
    # User functions
    get_user_by_email, get_user_by_username, get_user_by_id, get_all_users,
    create_user, update_user, delete_user,
    
    # Tenant functions
    get_tenant_by_id, get_tenant_by_domain, get_all_tenants,
    create_tenant, update_tenant, delete_tenant,
    
    # Plan functions
    get_plan_by_id, get_plans, get_all_plans, create_plan, update_plan, delete_plan,
    
    # Subscription functions
    get_subscription_by_id, get_tenant_subscription, get_subscription_by_tenant, get_all_subscriptions,
    create_subscription, update_subscription, delete_subscription,
    
    # TenantUser functions
    get_tenant_user, get_tenant_users, get_user_tenants, create_tenant_user, update_tenant_user, delete_tenant_user
)

from .project_crud import (
    # Project functions
    get_project_by_id, get_all_projects, get_projects_by_manager,
    create_project, update_project, delete_project, get_project_stats,
    
    # Task functions
    get_task_by_id, get_all_tasks, get_tasks_by_project, get_subtasks_by_parent, get_main_tasks_by_project, get_task_with_subtasks, get_tasks_by_assignee, get_tasks_by_creator,
    create_task, update_task, delete_task, get_task_stats
)

from .crm_crud import (
    # Lead functions
    get_lead_by_id, get_all_leads, get_leads, get_leads_by_status, get_leads_by_assignee,
    create_lead, update_lead, delete_lead,
    
    # Contact functions
    get_contact_by_id, get_all_contacts, get_contacts, get_contacts_by_company,
    create_contact, update_contact, delete_contact,
    
    # Company functions
    get_company_by_id, get_all_companies, get_companies, get_companies_by_industry,
    create_company, update_company, delete_company,
    
    # Opportunity functions
    get_opportunity_by_id, get_all_opportunities, get_opportunities, get_opportunities_by_stage, get_opportunities_by_assignee,
    create_opportunity, update_opportunity, delete_opportunity,
    
    # SalesActivity functions
    get_sales_activity_by_id, get_all_sales_activities, get_sales_activities, get_sales_activities_by_assignee,
    create_sales_activity, update_sales_activity, delete_sales_activity,
    
    # CRM Dashboard functions
    get_crm_dashboard_data
)

from .hrm_crud import (
    # Employee functions
    get_employee_by_id, get_employee_by_user_id, get_all_employees, get_employees, get_employees_by_department,
    create_employee, update_employee, delete_employee,
    
    # JobPosting functions
    get_job_posting_by_id, get_all_job_postings, get_job_postings, get_active_job_postings,
    create_job_posting, update_job_posting, delete_job_posting,
    
    # PerformanceReview functions
    get_performance_review_by_id, get_all_performance_reviews, get_performance_reviews, get_performance_reviews_by_employee,
    create_performance_review, update_performance_review, delete_performance_review,
    
    # TimeEntry functions
    get_time_entry_by_id, get_all_time_entries, get_time_entries, get_time_entries_by_employee,
    create_time_entry, update_time_entry, delete_time_entry,
    
    # LeaveRequest functions
    get_leave_request_by_id, get_all_leave_requests, get_leave_requests, get_leave_requests_by_employee,
    create_leave_request, update_leave_request, delete_leave_request,
    
    # Payroll functions
    get_payroll_by_id, get_all_payrolls, get_payroll, get_payrolls_by_employee,
    create_payroll, update_payroll, delete_payroll,
    
    # Benefits functions
    get_benefit_by_id, get_all_benefits, get_benefits, get_active_benefits,
    create_benefit, update_benefit, delete_benefit,
    
    # Training functions
    get_training_by_id, get_all_trainings, get_training,
    create_training, update_training, delete_training,
    
    # Training Enrollment functions
    get_training_enrollment_by_id, get_all_training_enrollments, get_training_enrollments,
    create_training_enrollment, update_training_enrollment, delete_training_enrollment,
    
    # Application functions
    get_application_by_id, get_all_applications, get_applications,
    create_application, update_application, delete_application,
    
    # Supplier functions
    get_supplier_by_id, get_supplier_by_code, get_all_suppliers, get_suppliers, get_active_suppliers,
    create_supplier, update_supplier, delete_supplier,
    
    # HRM Dashboard functions
    get_hrm_dashboard_data
)

from .inventory_crud import (
    # Product functions
    get_product_by_id, get_product_by_sku, get_all_products, get_products, get_products_by_category, get_low_stock_products,
    create_product, update_product, delete_product,
    
    # Warehouse functions
    get_warehouse_by_id, get_warehouse_by_code, get_all_warehouses, get_warehouses, get_active_warehouses,
    create_warehouse, update_warehouse, delete_warehouse,
    
    # StorageLocation functions
    get_storage_locations, get_storage_location_by_id, create_storage_location, update_storage_location, delete_storage_location,
    
    # Stock Movement functions
    get_stock_movements, get_stock_movement_by_id, create_stock_movement, update_stock_movement,
    
    # PurchaseOrder functions
    get_purchase_order_by_id, get_purchase_order_by_number, get_all_purchase_orders, get_purchase_orders,
    get_purchase_orders_by_status, get_purchase_orders_by_supplier,
    create_purchase_order, update_purchase_order, delete_purchase_order,
    
    # Receiving functions
    get_receiving_by_id, get_receiving_by_number, get_all_receivings, get_receivings, get_receivings_by_purchase_order,
    create_receiving, update_receiving, delete_receiving,
    
    # Inventory dashboard functions
    get_inventory_dashboard_stats
)

from .invoice_crud import (
    # Invoice functions
    get_invoice_by_id, get_invoice_by_number, get_all_invoices, get_invoices, get_invoices_by_status,
    get_invoices_by_customer, get_overdue_invoices, create_invoice, update_invoice, delete_invoice,
    
    # Payment functions
    get_payment_by_id, get_all_payments, get_payments, get_payments_by_invoice, get_payments_by_status,
    create_payment, update_payment, delete_payment,
    
    # Invoice Dashboard functions
    get_invoice_dashboard_data
)

from .pos_crud import (
    # POS Shift functions
    get_pos_shift_by_id, get_all_pos_shifts, get_pos_shifts, get_open_pos_shift,
    create_pos_shift, update_pos_shift, delete_pos_shift,
    
    # POS Transaction functions
    get_pos_transaction_by_id, get_all_pos_transactions, get_pos_transactions,
    get_pos_transactions_by_shift, get_pos_transactions_by_date_range,
    create_pos_transaction, update_pos_transaction, delete_pos_transaction,
    
    # POS Dashboard functions
    get_pos_dashboard_data
)

from .workshop_crud import (
    # Work Order functions
    get_work_order_by_id, get_all_work_orders, get_work_orders_by_status, get_work_orders_by_type,
    get_work_orders_by_assigned_user, get_work_orders_by_project, create_work_order, update_work_order, delete_work_order,
    get_work_order_stats, get_next_work_order_number,
    
    # Work Order Task functions
    get_work_order_task_by_id, get_work_order_tasks, create_work_order_task, update_work_order_task, delete_work_order_task
)

from .production_crud import (
    # Production Plan functions
    get_production_plan_by_id, get_all_production_plans, get_production_plans_by_status,
    get_production_plans_by_priority, get_production_plans_by_project, get_production_plans_by_work_order,
    get_production_plans_by_assigned_user, create_production_plan, update_production_plan, delete_production_plan,
    get_next_production_plan_number, get_production_plan_stats,
    
    # Production Step functions
    get_production_step_by_id, get_production_steps_by_plan, create_production_step,
    update_production_step, delete_production_step,
    
    # Production Schedule functions
    get_production_schedule_by_id, get_production_schedules_by_plan, create_production_schedule,
    update_production_schedule, delete_production_schedule
)

from .custom_options_crud import (
    # CustomEventType functions
    get_custom_event_type_by_id, get_all_custom_event_types, get_active_custom_event_types,
    create_custom_event_type, update_custom_event_type, delete_custom_event_type,
    
    # CustomDepartment functions
    get_custom_department_by_id, get_all_custom_departments, get_active_custom_departments,
    create_custom_department, update_custom_department, delete_custom_department,
    
    # CustomLeaveType functions
    get_custom_leave_type_by_id, get_all_custom_leave_types, get_active_custom_leave_types,
    create_custom_leave_type, update_custom_leave_type, delete_custom_leave_type,
    
    # CustomLeadSource functions
    get_custom_lead_source_by_id, get_all_custom_lead_sources, get_active_custom_lead_sources,
    create_custom_lead_source, update_custom_lead_source, delete_custom_lead_source,
    
    # CustomContactSource functions
    get_custom_contact_source_by_id, get_all_custom_contact_sources, get_active_custom_contact_sources,
    create_custom_contact_source, update_custom_contact_source, delete_custom_contact_source,
    
    # CustomCompanyIndustry functions
    get_custom_company_industry_by_id, get_all_custom_company_industries, get_active_custom_company_industries,
    create_custom_company_industry, update_custom_company_industry, delete_custom_company_industry,
    
    # CustomContactType functions
    get_custom_contact_type_by_id, get_all_custom_contact_types, get_active_custom_contact_types,
    create_custom_contact_type, update_custom_contact_type, delete_custom_contact_type,
    
    # CustomIndustry functions
    get_custom_industry_by_id, get_all_custom_industries, get_active_custom_industries,
    create_custom_industry, update_custom_industry, delete_custom_industry
)

from .audit_crud import (
    # AuditLog functions
    get_audit_log_by_id, get_all_audit_logs, get_audit_logs_by_event_type, get_audit_logs_by_severity,
    get_audit_logs_by_resource, create_audit_log, update_audit_log, delete_audit_log,
    get_audit_logs_by_date_range, get_audit_logs_by_action, get_failed_audit_logs,
    
    # Permission functions
    get_permission_by_code, get_all_permissions, create_permission, update_permission, delete_permission,
    get_permissions_by_codes, get_permissions,
    
    # CustomRole functions
    get_custom_role_by_id, get_custom_role_by_name, get_all_custom_roles,
    create_custom_role, update_custom_role, delete_custom_role, get_custom_roles_by_permission,
    get_custom_roles,
    
    # Audit statistics functions
    get_audit_statistics
)

# Export all models and functions for backward compatibility
__all__ = [
    # Database configuration
    'engine', 'SessionLocal', 'Base', 'create_tables', 'get_db',
    
    # Models
    'User', 'Tenant', 'Plan', 'Subscription', 'TenantUser', 'project_team_members',
    'Project', 'Task',
    'Lead', 'Contact', 'Company', 'Opportunity', 'SalesActivity',
    'Quote', 'Contract',
    'Employee', 'JobPosting', 'PerformanceReview', 'TimeEntry', 'LeaveRequest', 'Payroll', 'Benefits',
    'Training', 'TrainingEnrollment', 'Application',
    'Product', 'Warehouse', 'Supplier', 'PurchaseOrder', 'Receiving',
    'StorageLocation', 'StockMovement',
    'Invoice', 'Payment',
    'POSShift', 'POSTransaction',
    'WorkOrder', 'WorkOrderTask', 'WorkOrderStatus', 'WorkOrderPriority', 'WorkOrderType',
    'ProductionPlan', 'ProductionStep', 'ProductionSchedule', 'ProductionStatus', 'ProductionPriority', 'ProductionType',
    'CustomEventType', 'CustomDepartment', 'CustomLeaveType', 'CustomLeadSource',
    'CustomContactSource', 'CustomCompanyIndustry', 'CustomContactType', 'CustomIndustry',
    'AuditLog', 'Permission', 'CustomRole',
    
    # All CRUD functions are also exported
]
