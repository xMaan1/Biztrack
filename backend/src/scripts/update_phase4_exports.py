"""
Script to update all __init__.py files to export newly generated commands/queries
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

ENTITY_CONFIGS = [
    ('crm', 'Lead', 'LeadRepository', 'crm_entity'),
    ('crm', 'Contact', 'ContactRepository', 'crm_entity'),
    ('crm', 'Company', 'CompanyRepository', 'crm_entity'),
    ('crm', 'Opportunity', 'OpportunityRepository', 'crm_entity'),
    ('crm', 'SalesActivity', 'SalesActivityRepository', 'crm_entity'),
    ('hrm', 'Application', 'ApplicationRepository', 'hrm_entity'),
    ('hrm', 'PerformanceReview', 'PerformanceReviewRepository', 'hrm_entity'),
    ('hrm', 'TimeEntry', 'TimeEntryRepository', 'hrm_entity'),
    ('hrm', 'LeaveRequest', 'LeaveRequestRepository', 'hrm_entity'),
    ('hrm', 'Payroll', 'PayrollRepository', 'hrm_entity'),
    ('hrm', 'Benefits', 'BenefitsRepository', 'hrm_entity'),
    ('hrm', 'Training', 'TrainingRepository', 'hrm_entity'),
    ('hrm', 'TrainingEnrollment', 'TrainingEnrollmentRepository', 'hrm_entity'),
    ('hrm', 'Supplier', 'SupplierRepository', 'hrm_entity'),
    ('inventory', 'PurchaseOrder', 'PurchaseOrderRepository', 'inventory_entity'),
    ('inventory', 'Receiving', 'ReceivingRepository', 'inventory_entity'),
    ('inventory', 'StorageLocation', 'StorageLocationRepository', 'inventory_entity'),
    ('inventory', 'StockMovement', 'StockMovementRepository', 'inventory_entity'),
    ('ledger', 'ChartOfAccounts', 'ChartOfAccountsRepository', 'ledger_entity'),
    ('ledger', 'JournalEntry', 'JournalEntryRepository', 'ledger_entity'),
    ('ledger', 'LedgerTransaction', 'LedgerTransactionRepository', 'ledger_entity'),
    ('ledger', 'FinancialPeriod', 'FinancialPeriodRepository', 'ledger_entity'),
    ('ledger', 'Budget', 'BudgetRepository', 'ledger_entity'),
    ('ledger', 'BudgetItem', 'BudgetItemRepository', 'ledger_entity'),
    ('ledger', 'AccountReceivable', 'AccountReceivableRepository', 'ledger_entity'),
    ('invoice', 'Invoice', 'InvoiceRepository', 'invoice_entity'),
    ('invoice', 'Payment', 'PaymentRepository', 'invoice_entity'),
    ('sales', 'Quote', 'QuoteRepository', 'sales_entity'),
    ('sales', 'Contract', 'ContractRepository', 'sales_entity'),
    ('pos', 'POSShift', 'POSShiftRepository', 'pos_entity'),
    ('pos', 'POSTransaction', 'POSTransactionRepository', 'pos_entity'),
    ('workshop', 'WorkOrder', 'WorkOrderRepository', 'workshop_entity'),
    ('workshop', 'WorkOrderTask', 'WorkOrderTaskRepository', 'workshop_entity'),
    ('production', 'ProductionPlan', 'ProductionPlanRepository', 'production_entity'),
    ('production', 'ProductionStep', 'ProductionStepRepository', 'production_entity'),
    ('production', 'ProductionSchedule', 'ProductionScheduleRepository', 'production_entity'),
    ('event', 'Event', 'EventRepository', 'event_entity'),
    ('quality_control', 'QualityCheck', 'QualityCheckRepository', 'quality_control_entity'),
    ('quality_control', 'QualityInspection', 'QualityInspectionRepository', 'quality_control_entity'),
    ('quality_control', 'QualityDefect', 'QualityDefectRepository', 'quality_control_entity'),
    ('quality_control', 'QualityReport', 'QualityReportRepository', 'quality_control_entity'),
    ('maintenance', 'MaintenanceSchedule', 'MaintenanceScheduleRepository', 'maintenance_entity'),
    ('maintenance', 'MaintenanceWorkOrder', 'MaintenanceWorkOrderRepository', 'maintenance_entity'),
    ('maintenance', 'Equipment', 'EquipmentRepository', 'maintenance_entity'),
    ('maintenance', 'MaintenanceReport', 'MaintenanceReportRepository', 'maintenance_entity'),
    ('investment', 'Investment', 'InvestmentRepository', 'investment_entity'),
    ('investment', 'EquipmentInvestment', 'EquipmentInvestmentRepository', 'investment_entity'),
    ('investment', 'InvestmentTransaction', 'InvestmentTransactionRepository', 'investment_entity'),
    ('core', 'Role', 'RoleRepository', 'core_entity'),
    ('core', 'TenantUser', 'TenantUserRepository', 'core_entity'),
    ('notification', 'Notification', 'NotificationRepository', 'notification_entity'),
    ('notification', 'NotificationPreference', 'NotificationPreferenceRepository', 'notification_entity'),
    ('invoice_customization', 'InvoiceCustomization', 'InvoiceCustomizationRepository', 'invoice_customization_entity'),
]

def update_domain_init(domain: str, entities: list):
    """Update domain __init__.py file"""
    commands_dir = BASE_DIR / 'application' / 'commands' / domain
    queries_dir = BASE_DIR / 'application' / 'queries' / domain
    
    if not commands_dir.exists():
        return
    
    init_file = commands_dir / '__init__.py'
    
    imports = []
    exports = []
    
    for entity_name, _, _, _ in entities:
        entity_lower = entity_name.lower()
        imports.append(f"from .create_{entity_lower}.command import Create{entity_name}Command")
        imports.append(f"from .create_{entity_lower}.handler import Create{entity_name}Handler")
        imports.append(f"from .update_{entity_lower}.command import Update{entity_name}Command")
        imports.append(f"from .update_{entity_lower}.handler import Update{entity_name}Handler")
        imports.append(f"from .delete_{entity_lower}.command import Delete{entity_name}Command")
        imports.append(f"from .delete_{entity_lower}.handler import Delete{entity_name}Handler")
        
        exports.extend([
            f"'Create{entity_name}Command'", f"'Create{entity_name}Handler'",
            f"'Update{entity_name}Command'", f"'Update{entity_name}Handler'",
            f"'Delete{entity_name}Command'", f"'Delete{entity_name}Handler'",
        ])
    
    content = "\n".join(imports) + "\n\n__all__ = [\n    " + ",\n    ".join(exports) + ",\n]\n"
    
    with open(init_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    queries_init_file = queries_dir / '__init__.py'
    if queries_dir.exists():
        imports = []
        exports = []
        
        for entity_name, _, _, _ in entities:
            entity_lower = entity_name.lower()
            plural = entity_name + "s" if not entity_name.endswith('s') else entity_name + "es"
            if entity_name.endswith('y'):
                plural = entity_name[:-1] + "ies"
            
            imports.append(f"from .get_{entity_lower}_by_id.query import Get{entity_name}ByIdQuery")
            imports.append(f"from .get_{entity_lower}_by_id.handler import Get{entity_name}ByIdHandler")
            imports.append(f"from .get_all_{plural.lower()}.query import GetAll{plural}Query")
            imports.append(f"from .get_all_{plural.lower()}.handler import GetAll{plural}Handler")
            
            exports.extend([
                f"'Get{entity_name}ByIdQuery'", f"'Get{entity_name}ByIdHandler'",
                f"'GetAll{plural}Query'", f"'GetAll{plural}Handler'",
            ])
        
        content = "\n".join(imports) + "\n\n__all__ = [\n    " + ",\n    ".join(exports) + ",\n]\n"
        
        with open(queries_init_file, 'w', encoding='utf-8') as f:
            f.write(content)

def update_main_inits():
    """Update main commands and queries __init__.py files"""
    commands_init = BASE_DIR / 'application' / 'commands' / '__init__.py'
    queries_init = BASE_DIR / 'application' / 'queries' / '__init__.py'
    
    domain_entities = {}
    for domain, entity_name, repo_class, entity_module in ENTITY_CONFIGS:
        if domain not in domain_entities:
            domain_entities[domain] = []
        domain_entities[domain].append((entity_name, repo_class, entity_module, domain))
    
    cmd_imports = []
    cmd_exports = []
    
    query_imports = []
    query_exports = []
    
    for domain, entities in domain_entities.items():
        for entity_name, _, _, _ in entities:
            entity_lower = entity_name.lower()
            
            cmd_imports.append(f"from .{domain} import (")
            cmd_imports.append(f"    Create{entity_name}Command, Create{entity_name}Handler,")
            cmd_imports.append(f"    Update{entity_name}Command, Update{entity_name}Handler,")
            cmd_imports.append(f"    Delete{entity_name}Command, Delete{entity_name}Handler,")
            cmd_imports.append(")")
            
            cmd_exports.extend([
                f"'Create{entity_name}Command'", f"'Create{entity_name}Handler'",
                f"'Update{entity_name}Command'", f"'Update{entity_name}Handler'",
                f"'Delete{entity_name}Command'", f"'Delete{entity_name}Handler'",
            ])
            
            plural = entity_name + "s" if not entity_name.endswith('s') else entity_name + "es"
            if entity_name.endswith('y'):
                plural = entity_name[:-1] + "ies"
            
            query_imports.append(f"from .{domain} import (")
            query_imports.append(f"    Get{entity_name}ByIdQuery, Get{entity_name}ByIdHandler,")
            query_imports.append(f"    GetAll{plural}Query, GetAll{plural}Handler,")
            query_imports.append(")")
            
            query_exports.extend([
                f"'Get{entity_name}ByIdQuery'", f"'Get{entity_name}ByIdHandler'",
                f"'GetAll{plural}Query'", f"'GetAll{plural}Handler'",
            ])
    
    existing_commands = BASE_DIR / 'application' / 'commands' / '__init__.py'
    if existing_commands.exists():
        with open(existing_commands, 'r', encoding='utf-8') as f:
            existing = f.read()
        
        for domain in ['users', 'projects', 'banking', 'crm', 'hrm', 'inventory']:
            if domain not in domain_entities:
                if f'from .{domain} import' in existing:
                    lines = [l for l in existing.split('\n') if f'from .{domain} import' in l or (l.strip().startswith("'") and domain in existing)]
                    cmd_imports.extend(lines[:4])
    
    cmd_content = "\n".join(cmd_imports) + "\n\n__all__ = [\n    " + ",\n    ".join(cmd_exports) + ",\n]\n"
    query_content = "\n".join(query_imports) + "\n\n__all__ = [\n    " + ",\n    ".join(query_exports) + ",\n]\n"
    
    print("Note: Main __init__.py files need manual review due to existing exports")
    print("Domain-level __init__.py files have been updated")

def main():
    """Update all __init__.py files"""
    print("Updating domain __init__.py files...")
    
    domain_entities = {}
    for domain, entity_name, repo_class, entity_module in ENTITY_CONFIGS:
        if domain not in domain_entities:
            domain_entities[domain] = []
        domain_entities[domain].append((entity_name, repo_class, entity_module, domain))
    
    for domain, entities in domain_entities.items():
        print(f"  Updating {domain}...")
        update_domain_init(domain, entities)
    
    print("\nDone! Main __init__.py files need manual review.")

if __name__ == '__main__':
    main()

