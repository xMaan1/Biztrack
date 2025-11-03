"""
Comprehensive Phase 4 Commands/Queries Generator
Generates high-quality, production-ready code following established patterns
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

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

def parse_entity_fields(entity_file: str, entity_name: str) -> Dict[str, Dict]:
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
            
            is_uuid = 'UUID' in column_args
            is_foreign_key = 'ForeignKey' in column_args
            is_optional = 'nullable=True' in column_args or (is_foreign_key and 'nullable=False' not in column_args)
            is_datetime = 'DateTime' in column_args
            is_date = 'Date' in column_args and 'DateTime' not in column_args
            is_json = 'JSON' in column_args
            is_bool = 'Boolean' in column_args
            is_int = 'Integer' in column_args
            is_float = 'Float' in column_args
            has_default = 'default=' in column_args
            
            fields[field_name] = {
                'is_uuid': is_uuid,
                'is_foreign_key': is_foreign_key,
                'is_optional': is_optional,
                'is_datetime': is_datetime,
                'is_date': is_date,
                'is_json': is_json,
                'is_bool': is_bool,
                'is_int': is_int,
                'is_float': is_float,
                'has_default': has_default,
            }
    except Exception as e:
        print(f"Warning: Could not parse {entity_name}: {e}")
    
    return fields

def generate_create_command_content(entity_name: str, fields: Dict[str, Dict]) -> str:
    """Generate Create command content"""
    entity_id = entity_name.lower() + "_id"
    
    command_fields = ["    tenant_id: str"]
    
    for field_name, field_info in sorted(fields.items()):
        if field_info['is_uuid']:
            python_type = "str"
        elif field_info['is_datetime']:
            python_type = "datetime"
        elif field_info['is_date']:
            python_type = "date"
        elif field_info['is_json']:
            python_type = "List[str]"
        elif field_info['is_bool']:
            python_type = "bool"
        elif field_info['is_int']:
            python_type = "int"
        elif field_info['is_float']:
            python_type = "float"
        else:
            python_type = "str"
        
        if field_info['is_optional'] or field_info['has_default']:
            default_val = "None"
            if field_info['is_bool'] and field_info['has_default']:
                default_val = "False"
            elif field_info['is_int'] and field_info['has_default']:
                default_val = "0"
            elif field_info['is_float'] and field_info['has_default']:
                default_val = "0.0"
            elif field_info['is_json']:
                default_val = "None"
            command_fields.append(f"    {field_name}: Optional[{python_type}] = {default_val}")
        else:
            command_fields.append(f"    {field_name}: {python_type}")
    
    command_fields.append("    created_by: Optional[str] = None")
    
    imports = "from dataclasses import dataclass\nfrom typing import Optional, List\n"
    if any(f['is_datetime'] or f['is_date'] for f in fields.values()):
        imports += "from datetime import datetime, date\n"
    imports += "from ....core.command import ICommand\n"
    
    return f"""{imports}
@dataclass
class Create{entity_name}Command(ICommand):
{chr(10).join(command_fields)}
"""

def generate_create_handler_content(entity_name: str, repo_class: str, entity_module: str, fields: Dict[str, Dict]) -> str:
    """Generate Create handler content"""
    entity_var = entity_name.lower()
    
    field_mappings = []
    needs_date_import = False
    needs_json_import = False
    
    for field_name, field_info in sorted(fields.items()):
        if field_info['is_uuid']:
            if field_info['is_optional']:
                field_mappings.append(f"                    {field_name}=uuid.UUID(command.{field_name}) if command.{field_name} else None,")
            else:
                field_mappings.append(f"                    {field_name}=uuid.UUID(command.{field_name}),")
        elif field_info['is_date']:
            needs_date_import = True
            if field_info['is_optional']:
                field_mappings.append(f"                    {field_name}=datetime.strptime(command.{field_name}, \"%Y-%m-%d\").date() if command.{field_name} else None,")
            else:
                field_mappings.append(f"                    {field_name}=datetime.strptime(command.{field_name}, \"%Y-%m-%d\").date() if command.{field_name} else datetime.now().date(),")
        elif field_info['is_datetime']:
            if field_info['is_optional']:
                field_mappings.append(f"                    {field_name}=datetime.fromisoformat(command.{field_name}.replace('Z', '+00:00')) if command.{field_name} else None,")
            else:
                field_mappings.append(f"                    {field_name}=datetime.fromisoformat(command.{field_name}.replace('Z', '+00:00')) if command.{field_name} else datetime.utcnow(),")
        elif field_info['is_json']:
            needs_json_import = True
            field_mappings.append(f"                    {field_name}=command.{field_name} or [],")
        elif field_name.lower().endswith('email'):
            field_mappings.append(f"                    {field_name}=command.{field_name}.lower() if command.{field_name} else None,")
        else:
            field_mappings.append(f"                    {field_name}=command.{field_name},")
    
    imports = "from datetime import datetime\nimport uuid\n"
    if needs_date_import:
        imports += "from datetime import date\n"
    if needs_json_import:
        imports += "import json\n"
    
    return f"""{imports}from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from ....domain.entities.{entity_module} import {entity_name}
from .command import Create{entity_name}Command

class Create{entity_name}Handler(RequestHandlerBase[Create{entity_name}Command, Result[{entity_name}]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: Create{entity_name}Command) -> Result[{entity_name}]:
        try:
            with self._unit_of_work as uow:
                repo = {repo_class}(uow.session)
                
                {entity_var} = {entity_name}(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
{chr(10).join(field_mappings)}
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add({entity_var})
                uow.commit()
                return Result.success({entity_var})
                
        except Exception as e:
            return Result.failure(f"Failed to create {entity_name.lower()}: {{str(e)}}")
"""

def generate_update_command_content(entity_name: str, fields: Dict[str, Dict]) -> str:
    """Generate Update command content"""
    entity_id = entity_name.lower() + "_id"
    
    command_fields = [
        "    tenant_id: str",
        f"    {entity_id}: str"
    ]
    
    for field_name, field_info in sorted(fields.items()):
        if field_info['is_uuid']:
            python_type = "str"
        elif field_info['is_datetime']:
            python_type = "datetime"
        elif field_info['is_date']:
            python_type = "date"
        elif field_info['is_json']:
            python_type = "List[str]"
        elif field_info['is_bool']:
            python_type = "bool"
        elif field_info['is_int']:
            python_type = "int"
        elif field_info['is_float']:
            python_type = "float"
        else:
            python_type = "str"
        
        command_fields.append(f"    {field_name}: Optional[{python_type}] = None")
    
    imports = "from dataclasses import dataclass\nfrom typing import Optional, List\n"
    if any(f['is_datetime'] or f['is_date'] for f in fields.values()):
        imports += "from datetime import datetime, date\n"
    imports += "from ....core.command import ICommand\n"
    
    return f"""{imports}
@dataclass
class Update{entity_name}Command(ICommand):
{chr(10).join(command_fields)}
"""

def generate_update_handler_content(entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate Update handler content"""
    entity_id = entity_name.lower() + "_id"
    entity_var = entity_name.lower()
    
    return f"""from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from ....domain.entities.{entity_module} import {entity_name}
from .command import Update{entity_name}Command

class Update{entity_name}Handler(RequestHandlerBase[Update{entity_name}Command, Result[{entity_name}]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: Update{entity_name}Command) -> Result[{entity_name}]:
        try:
            with self._unit_of_work as uow:
                repo = {repo_class}(uow.session)
                
                {entity_var} = repo.get_by_id(command.{entity_id}, command.tenant_id)
                if not {entity_var}:
                    return Result.failure("{entity_name} not found")
                
                # Update fields - follow pattern: if command.field_name is not None: entity.field_name = command.field_name
                # For UUID fields: entity.field_name = uuid.UUID(command.field_name) if command.field_name else None
                # For datetime fields: entity.field_name = datetime.fromisoformat(command.field_name.replace('Z', '+00:00')) if command.field_name else None
                # For date fields: entity.field_name = datetime.strptime(command.field_name, "%Y-%m-%d").date() if command.field_name else None
                
                {entity_var}.updatedAt = datetime.utcnow()
                repo.update({entity_var})
                uow.commit()
                
                return Result.success({entity_var})
                
        except Exception as e:
            return Result.failure(f"Failed to update {entity_name.lower()}: {{str(e)}}")
"""

def generate_delete_command_content(entity_name: str) -> str:
    """Generate Delete command content"""
    entity_id = entity_name.lower() + "_id"
    return f"""from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class Delete{entity_name}Command(ICommand):
    tenant_id: str
    {entity_id}: str
"""

def generate_delete_handler_content(entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate Delete handler content"""
    entity_id = entity_name.lower() + "_id"
    entity_var = entity_name.lower()
    
    return f"""from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from .command import Delete{entity_name}Command

class Delete{entity_name}Handler(RequestHandlerBase[Delete{entity_name}Command, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: Delete{entity_name}Command) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = {repo_class}(uow.session)
                
                {entity_var} = repo.get_by_id(command.{entity_id}, command.tenant_id)
                if not {entity_var}:
                    return Result.failure("{entity_name} not found")
                
                repo.delete({entity_var})
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete {entity_name.lower()}: {{str(e)}}")
"""

def generate_get_by_id_query_content(entity_name: str) -> str:
    """Generate GetById query content"""
    entity_id = entity_name.lower() + "_id"
    return f"""from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class Get{entity_name}ByIdQuery(IQuery):
    tenant_id: str
    {entity_id}: str
"""

def generate_get_by_id_handler_content(entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate GetById handler content"""
    entity_id = entity_name.lower() + "_id"
    
    return f"""from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from ....domain.entities.{entity_module} import {entity_name}
from .query import Get{entity_name}ByIdQuery

class Get{entity_name}ByIdHandler(RequestHandlerBase[Get{entity_name}ByIdQuery, Result[Optional[{entity_name}]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: Get{entity_name}ByIdQuery) -> Result[Optional[{entity_name}]]:
        try:
            with self._unit_of_work as uow:
                repo = {repo_class}(uow.session)
                entity = repo.get_by_id(query.{entity_id}, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get {entity_name.lower()}: {{str(e)}}")
"""

def generate_get_all_query_content(entity_name: str) -> str:
    """Generate GetAll query content"""
    plural = entity_name + "s" if not entity_name.endswith('s') else entity_name + "es"
    if entity_name.endswith('y'):
        plural = entity_name[:-1] + "ies"
    
    return f"""from dataclasses import dataclass
from typing import Optional

@dataclass
class GetAll{plural}Query:
    tenant_id: str
    page: int = 1
    page_size: int = 10
    sort_by: Optional[str] = None
    sort_order: str = 'asc'
    
    def __post_init__(self):
        if self.page < 1:
            raise ValueError("Page must be greater than 0")
        if self.page_size < 1:
            raise ValueError("Page size must be greater than 0")
        if self.sort_order not in ['asc', 'desc']:
            raise ValueError("Sort order must be 'asc' or 'desc'")
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size
"""

def generate_get_all_handler_content(entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate GetAll handler content"""
    plural = entity_name + "s" if not entity_name.endswith('s') else entity_name + "es"
    if entity_name.endswith('y'):
        plural = entity_name[:-1] + "ies"
    
    return f"""from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from ....domain.entities.{entity_module} import {entity_name}
from .query import GetAll{plural}Query

class GetAll{plural}Handler(RequestHandlerBase[GetAll{plural}Query, Result[PagedResult[{entity_name}]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAll{plural}Query) -> Result[PagedResult[{entity_name}]]:
        try:
            with self._unit_of_work as uow:
                repo = {repo_class}(uow.session)
                import uuid
                
                filters = [{entity_name}.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query({entity_name}).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = {entity_name}.createdAt if hasattr({entity_name}, 'createdAt') else {entity_name}.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get {entity_name.lower()}s: {{str(e)}}")
"""

def create_entity_structure(domain: str, entity_name: str, repo_class: str, entity_module: str):
    """Create complete command/query structure for an entity"""
    entity_lower = entity_name.lower()
    fields = parse_entity_fields(entity_module, entity_name)
    
    commands_dir = BASE_DIR / 'application' / 'commands' / domain
    queries_dir = BASE_DIR / 'application' / 'queries' / domain
    
    # Create commands
    for op in ['create', 'update', 'delete']:
        op_dir = commands_dir / f"{op}_{entity_lower}"
        op_dir.mkdir(parents=True, exist_ok=True)
        
        if op == 'create':
            with open(op_dir / 'command.py', 'w', encoding='utf-8') as f:
                f.write(generate_create_command_content(entity_name, fields))
            with open(op_dir / 'handler.py', 'w', encoding='utf-8') as f:
                f.write(generate_create_handler_content(entity_name, repo_class, entity_module, fields))
        elif op == 'update':
            with open(op_dir / 'command.py', 'w', encoding='utf-8') as f:
                f.write(generate_update_command_content(entity_name, fields))
            with open(op_dir / 'handler.py', 'w', encoding='utf-8') as f:
                f.write(generate_update_handler_content(entity_name, repo_class, entity_module))
        elif op == 'delete':
            with open(op_dir / 'command.py', 'w', encoding='utf-8') as f:
                f.write(generate_delete_command_content(entity_name))
            with open(op_dir / 'handler.py', 'w', encoding='utf-8') as f:
                f.write(generate_delete_handler_content(entity_name, repo_class, entity_module))
    
    # Create queries
    for query_type in ['get_by_id', 'get_all']:
        if query_type == 'get_by_id':
            query_name = f"get_{entity_lower}_by_id"
        else:
            plural = entity_name + "s" if not entity_name.endswith('s') else entity_name + "es"
            if entity_name.endswith('y'):
                plural = entity_name[:-1] + "ies"
            query_name = f"get_all_{plural.lower()}"
        
        query_dir = queries_dir / query_name
        query_dir.mkdir(parents=True, exist_ok=True)
        
        if query_type == 'get_by_id':
            with open(query_dir / 'query.py', 'w', encoding='utf-8') as f:
                f.write(generate_get_by_id_query_content(entity_name))
            with open(query_dir / 'handler.py', 'w', encoding='utf-8') as f:
                f.write(generate_get_by_id_handler_content(entity_name, repo_class, entity_module))
        else:
            with open(query_dir / 'query.py', 'w', encoding='utf-8') as f:
                f.write(generate_get_all_query_content(entity_name))
            with open(query_dir / 'handler.py', 'w', encoding='utf-8') as f:
                f.write(generate_get_all_handler_content(entity_name, repo_class, entity_module))

def main():
    """Generate all command and query structures"""
    print("=" * 60)
    print("Phase 4 Commands/Queries Generator")
    print("=" * 60)
    print(f"Total entities to process: {len(ENTITY_CONFIGS)}\n")
    
    success_count = 0
    error_count = 0
    
    for idx, (domain, entity_name, repo_class, entity_module) in enumerate(ENTITY_CONFIGS, 1):
        try:
            print(f"[{idx:2d}/{len(ENTITY_CONFIGS)}] Processing {domain}.{entity_name}...", end=" ")
            create_entity_structure(domain, entity_name, repo_class, entity_module)
            print("OK")
            success_count += 1
        except Exception as e:
            print(f"ERROR: {e}")
            error_count += 1
    
    print("\n" + "=" * 60)
    print(f"Generation complete!")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")
    print("=" * 60)
    print("\nIMPORTANT NEXT STEPS:")
    print("1. Review generated Update handlers and complete field mapping logic")
    print("2. Add validation logic where needed (duplicate checks, etc.)")
    print("3. Update domain __init__.py files to export new commands/queries")
    print("4. Update main commands/__init__.py and queries/__init__.py")
    print("5. Test each command/query handler")

if __name__ == '__main__':
    main()

