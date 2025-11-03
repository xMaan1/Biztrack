"""
Script to complete all Update handlers with proper field mappings
"""

import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

ENTITY_CONFIGS = [
    ('crm', 'Lead', 'crm_entity'),
    ('crm', 'Contact', 'crm_entity'),
    ('crm', 'Company', 'crm_entity'),
    ('crm', 'Opportunity', 'crm_entity'),
    ('crm', 'SalesActivity', 'crm_entity'),
    ('hrm', 'Application', 'hrm_entity'),
    ('hrm', 'PerformanceReview', 'hrm_entity'),
    ('hrm', 'TimeEntry', 'hrm_entity'),
    ('hrm', 'LeaveRequest', 'hrm_entity'),
    ('hrm', 'Payroll', 'hrm_entity'),
    ('hrm', 'Benefits', 'hrm_entity'),
    ('hrm', 'Training', 'hrm_entity'),
    ('hrm', 'TrainingEnrollment', 'hrm_entity'),
    ('hrm', 'Supplier', 'hrm_entity'),
    ('inventory', 'PurchaseOrder', 'inventory_entity'),
    ('inventory', 'Receiving', 'inventory_entity'),
    ('inventory', 'StorageLocation', 'inventory_entity'),
    ('inventory', 'StockMovement', 'inventory_entity'),
    ('ledger', 'ChartOfAccounts', 'ledger_entity'),
    ('ledger', 'JournalEntry', 'ledger_entity'),
    ('ledger', 'LedgerTransaction', 'ledger_entity'),
    ('ledger', 'FinancialPeriod', 'ledger_entity'),
    ('ledger', 'Budget', 'ledger_entity'),
    ('ledger', 'BudgetItem', 'ledger_entity'),
    ('ledger', 'AccountReceivable', 'ledger_entity'),
    ('invoice', 'Invoice', 'invoice_entity'),
    ('invoice', 'Payment', 'invoice_entity'),
    ('sales', 'Quote', 'sales_entity'),
    ('sales', 'Contract', 'sales_entity'),
    ('pos', 'POSShift', 'pos_entity'),
    ('pos', 'POSTransaction', 'pos_entity'),
    ('workshop', 'WorkOrder', 'workshop_entity'),
    ('workshop', 'WorkOrderTask', 'workshop_entity'),
    ('production', 'ProductionPlan', 'production_entity'),
    ('production', 'ProductionStep', 'production_entity'),
    ('production', 'ProductionSchedule', 'production_entity'),
    ('event', 'Event', 'event_entity'),
    ('quality_control', 'QualityCheck', 'quality_control_entity'),
    ('quality_control', 'QualityInspection', 'quality_control_entity'),
    ('quality_control', 'QualityDefect', 'quality_control_entity'),
    ('quality_control', 'QualityReport', 'quality_control_entity'),
    ('maintenance', 'MaintenanceSchedule', 'maintenance_entity'),
    ('maintenance', 'MaintenanceWorkOrder', 'maintenance_entity'),
    ('maintenance', 'Equipment', 'maintenance_entity'),
    ('maintenance', 'MaintenanceReport', 'maintenance_entity'),
    ('investment', 'Investment', 'investment_entity'),
    ('investment', 'EquipmentInvestment', 'investment_entity'),
    ('investment', 'InvestmentTransaction', 'investment_entity'),
    ('core', 'Role', 'core_entity'),
    ('core', 'TenantUser', 'core_entity'),
    ('notification', 'Notification', 'notification_entity'),
    ('notification', 'NotificationPreference', 'notification_entity'),
    ('invoice_customization', 'InvoiceCustomization', 'invoice_customization_entity'),
]

def parse_entity_fields(entity_file: str, entity_name: str) -> dict:
    """Parse entity file to extract field information"""
    entity_path = BASE_DIR / 'domain' / 'entities' / f"{entity_file}.py"
    if not entity_path.exists():
        return {}
    
    fields = {}
    try:
        with open(entity_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        class_pattern = rf'class {entity_name}\(Base\).*?(?=class |def |\Z)'
        match = re.search(class_pattern, content, re.DOTALL)
        if not match:
            return {}
        
        class_body = match.group(0)
        
        column_pattern = r'(\w+)\s*=\s*Column\((.*?)\)'
        for match in re.finditer(column_pattern, class_body):
            field_name = match.group(1)
            if field_name in ['id', 'tenant_id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']:
                continue
            
            column_args = match.group(2)
            
            fields[field_name] = {
                'is_uuid': 'UUID' in column_args,
                'is_datetime': 'DateTime' in column_args,
                'is_date': 'Date' in column_args and 'DateTime' not in column_args,
                'is_json': 'JSON' in column_args,
                'is_optional': 'nullable=True' in column_args,
            }
    except Exception as e:
        print(f"Warning: Could not parse {entity_name}: {e}")
    
    return fields

def generate_update_mappings(entity_name: str, fields: dict) -> list:
    """Generate field mapping lines for update handler"""
    entity_var = entity_name.lower()
    mappings = []
    
    for field_name, field_info in sorted(fields.items()):
        if field_info['is_uuid']:
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = uuid.UUID(command.{field_name}) if command.{field_name} else None")
        elif field_info['is_datetime']:
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = datetime.fromisoformat(command.{field_name}.replace('Z', '+00:00')) if command.{field_name} else None")
        elif field_info['is_date']:
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = datetime.strptime(command.{field_name}, \"%Y-%m-%d\").date() if command.{field_name} else None")
        elif field_info['is_json']:
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = command.{field_name} or []")
        elif field_name.lower().endswith('email'):
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = command.{field_name}.lower() if command.{field_name} else None")
        else:
            mappings.append(f"                if command.{field_name} is not None:")
            mappings.append(f"                    {entity_var}.{field_name} = command.{field_name}")
    
    return mappings

def complete_update_handler(domain: str, entity_name: str, entity_module: str):
    """Complete update handler with proper field mappings"""
    entity_lower = entity_name.lower()
    handler_path = BASE_DIR / 'application' / 'commands' / domain / f"update_{entity_lower}" / 'handler.py'
    
    if not handler_path.exists():
        return False
    
    fields = parse_entity_fields(entity_module, entity_name)
    if not fields:
        return False
    
    mappings = generate_update_mappings(entity_name, fields)
    
    try:
        with open(handler_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        entity_var = entity_name.lower()
        entity_id = f"{entity_var}_id"
        
        comment_pattern = r'# Update fields.*?# For date fields.*?\n'
        
        new_mapping_code = '\n'.join(mappings) + '\n'
        
        content = re.sub(comment_pattern, new_mapping_code, content, flags=re.DOTALL)
        
        with open(handler_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Error updating {domain}.{entity_name}: {e}")
        return False

def main():
    """Complete all update handlers"""
    print("Completing Update handlers...")
    print(f"Total entities: {len(ENTITY_CONFIGS)}\n")
    
    success = 0
    failed = 0
    
    for idx, (domain, entity_name, entity_module) in enumerate(ENTITY_CONFIGS, 1):
        print(f"[{idx:2d}/{len(ENTITY_CONFIGS)}] {domain}.{entity_name}...", end=" ")
        if complete_update_handler(domain, entity_name, entity_module):
            print("OK")
            success += 1
        else:
            print("SKIP")
            failed += 1
    
    print(f"\nComplete! Success: {success}, Failed: {failed}")

if __name__ == '__main__':
    main()

