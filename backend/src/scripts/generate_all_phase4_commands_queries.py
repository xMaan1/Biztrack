"""
Comprehensive script to generate all Phase 4 Commands and Queries.
This script follows established patterns and ensures code quality.
"""

import os
import re
import ast
from pathlib import Path
from typing import Dict, List, Tuple, Optional

BASE_DIR = Path(__file__).parent.parent

ENTITY_CONFIGS = [
    ('crm', 'Lead', 'Lead', 'LeadRepository', 'crm_entity'),
    ('crm', 'Contact', 'Contact', 'ContactRepository', 'crm_entity'),
    ('crm', 'Company', 'Company', 'CompanyRepository', 'crm_entity'),
    ('crm', 'Opportunity', 'Opportunity', 'OpportunityRepository', 'crm_entity'),
    ('crm', 'SalesActivity', 'SalesActivity', 'SalesActivityRepository', 'crm_entity'),
    ('hrm', 'Application', 'Application', 'ApplicationRepository', 'hrm_entity'),
    ('hrm', 'PerformanceReview', 'PerformanceReview', 'PerformanceReviewRepository', 'hrm_entity'),
    ('hrm', 'TimeEntry', 'TimeEntry', 'TimeEntryRepository', 'hrm_entity'),
    ('hrm', 'LeaveRequest', 'LeaveRequest', 'LeaveRequestRepository', 'hrm_entity'),
    ('hrm', 'Payroll', 'Payroll', 'PayrollRepository', 'hrm_entity'),
    ('hrm', 'Benefits', 'Benefits', 'BenefitsRepository', 'hrm_entity'),
    ('hrm', 'Training', 'Training', 'TrainingRepository', 'hrm_entity'),
    ('hrm', 'TrainingEnrollment', 'TrainingEnrollment', 'TrainingEnrollmentRepository', 'hrm_entity'),
    ('hrm', 'Supplier', 'Supplier', 'SupplierRepository', 'hrm_entity'),
    ('inventory', 'PurchaseOrder', 'PurchaseOrder', 'PurchaseOrderRepository', 'inventory_entity'),
    ('inventory', 'Receiving', 'Receiving', 'ReceivingRepository', 'inventory_entity'),
    ('inventory', 'StorageLocation', 'StorageLocation', 'StorageLocationRepository', 'inventory_entity'),
    ('inventory', 'StockMovement', 'StockMovement', 'StockMovementRepository', 'inventory_entity'),
    ('ledger', 'ChartOfAccounts', 'ChartOfAccounts', 'ChartOfAccountsRepository', 'ledger_entity'),
    ('ledger', 'JournalEntry', 'JournalEntry', 'JournalEntryRepository', 'ledger_entity'),
    ('ledger', 'LedgerTransaction', 'LedgerTransaction', 'LedgerTransactionRepository', 'ledger_entity'),
    ('ledger', 'FinancialPeriod', 'FinancialPeriod', 'FinancialPeriodRepository', 'ledger_entity'),
    ('ledger', 'Budget', 'Budget', 'BudgetRepository', 'ledger_entity'),
    ('ledger', 'BudgetItem', 'BudgetItem', 'BudgetItemRepository', 'ledger_entity'),
    ('ledger', 'AccountReceivable', 'AccountReceivable', 'AccountReceivableRepository', 'ledger_entity'),
    ('invoice', 'Invoice', 'Invoice', 'InvoiceRepository', 'invoice_entity'),
    ('invoice', 'Payment', 'Payment', 'PaymentRepository', 'invoice_entity'),
    ('sales', 'Quote', 'Quote', 'QuoteRepository', 'sales_entity'),
    ('sales', 'Contract', 'Contract', 'ContractRepository', 'sales_entity'),
    ('pos', 'POSShift', 'POSShift', 'POSShiftRepository', 'pos_entity'),
    ('pos', 'POSTransaction', 'POSTransaction', 'POSTransactionRepository', 'pos_entity'),
    ('workshop', 'WorkOrder', 'WorkOrder', 'WorkOrderRepository', 'workshop_entity'),
    ('workshop', 'WorkOrderTask', 'WorkOrderTask', 'WorkOrderTaskRepository', 'workshop_entity'),
    ('production', 'ProductionPlan', 'ProductionPlan', 'ProductionPlanRepository', 'production_entity'),
    ('production', 'ProductionStep', 'ProductionStep', 'ProductionStepRepository', 'production_entity'),
    ('production', 'ProductionSchedule', 'ProductionSchedule', 'ProductionScheduleRepository', 'production_entity'),
    ('event', 'Event', 'Event', 'EventRepository', 'event_entity'),
    ('quality_control', 'QualityCheck', 'QualityCheck', 'QualityCheckRepository', 'quality_control_entity'),
    ('quality_control', 'QualityInspection', 'QualityInspection', 'QualityInspectionRepository', 'quality_control_entity'),
    ('quality_control', 'QualityDefect', 'QualityDefect', 'QualityDefectRepository', 'quality_control_entity'),
    ('quality_control', 'QualityReport', 'QualityReport', 'QualityReportRepository', 'quality_control_entity'),
    ('maintenance', 'MaintenanceSchedule', 'MaintenanceSchedule', 'MaintenanceScheduleRepository', 'maintenance_entity'),
    ('maintenance', 'MaintenanceWorkOrder', 'MaintenanceWorkOrder', 'MaintenanceWorkOrderRepository', 'maintenance_entity'),
    ('maintenance', 'Equipment', 'Equipment', 'EquipmentRepository', 'maintenance_entity'),
    ('maintenance', 'MaintenanceReport', 'MaintenanceReport', 'MaintenanceReportRepository', 'maintenance_entity'),
    ('investment', 'Investment', 'Investment', 'InvestmentRepository', 'investment_entity'),
    ('investment', 'EquipmentInvestment', 'EquipmentInvestment', 'EquipmentInvestmentRepository', 'investment_entity'),
    ('investment', 'InvestmentTransaction', 'InvestmentTransaction', 'InvestmentTransactionRepository', 'investment_entity'),
    ('core', 'Role', 'Role', 'RoleRepository', 'core_entity'),
    ('core', 'TenantUser', 'TenantUser', 'TenantUserRepository', 'core_entity'),
    ('notification', 'Notification', 'Notification', 'NotificationRepository', 'notification_entity'),
    ('notification', 'NotificationPreference', 'NotificationPreference', 'NotificationPreferenceRepository', 'notification_entity'),
    ('invoice_customization', 'InvoiceCustomization', 'InvoiceCustomization', 'InvoiceCustomizationRepository', 'invoice_customization_entity'),
]

def get_entity_fields(entity_file: str, entity_name: str) -> Dict[str, Tuple[str, bool]]:
    """Extract field definitions from entity file"""
    entity_path = BASE_DIR / 'domain' / 'entities' / entity_file
    if not entity_path.exists():
        return {}
    
    fields = {}
    try:
        with open(entity_path, 'r') as f:
            content = f.read()
        
        class_pattern = rf'class {entity_name}\(.*?\):.*?__tablename__.*?((?:class |\Z))'
        match = re.search(class_pattern, content, re.DOTALL)
        if not match:
            return {}
        
        class_content = match.group(0)
        
        column_pattern = r'(\w+)\s*=\s*Column\([^)]*\)'
        for match in re.finditer(column_pattern, class_content):
            field_name = match.group(1)
            field_def = match.group(0)
            
            is_optional = 'nullable=True' in field_def or ('nullable=False' not in field_def and 'ForeignKey' in field_def)
            
            if 'UUID' in field_def:
                field_type = 'UUID'
            elif 'String' in field_def or 'Text' in field_def:
                field_type = 'String'
            elif 'Integer' in field_def:
                field_type = 'Integer'
            elif 'Float' in field_def:
                field_type = 'Float'
            elif 'Boolean' in field_def:
                field_type = 'Boolean'
            elif 'DateTime' in field_def:
                field_type = 'DateTime'
            elif 'Date' in field_def:
                field_type = 'Date'
            elif 'JSON' in field_def:
                field_type = 'JSON'
            else:
                field_type = 'String'
            
            if field_name not in ['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'tenant_id']:
                fields[field_name] = (field_type, is_optional)
    except Exception as e:
        print(f"Warning: Could not parse fields for {entity_name}: {e}")
    
    return fields

def generate_create_command(domain: str, entity_name: str, fields: Dict[str, Tuple[str, bool]]) -> str:
    """Generate Create command file"""
    command_fields = ["tenant_id: str"]
    
    for field_name, (field_type, is_optional) in fields.items():
        if field_name in ['tenant_id', 'id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']:
            continue
        
        python_type = {
            'UUID': 'str',
            'String': 'str',
            'Integer': 'int',
            'Float': 'float',
            'Boolean': 'bool',
            'DateTime': 'datetime',
            'Date': 'date',
            'JSON': 'List[str]'
        }.get(field_type, 'str')
        
        if is_optional:
            command_fields.append(f"    {field_name}: Optional[{python_type}] = None")
        else:
            command_fields.append(f"    {field_name}: {python_type}")
    
    command_fields.append("    created_by: str = None")
    
    return f"""from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class Create{entity_name}Command(ICommand):
{chr(10).join(command_fields)}
"""

def generate_create_handler(domain: str, entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate Create handler file"""
    return f"""from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
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
                
                entity = {entity_name}(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
{_generate_entity_fields_mapping(entity_name, 'create')}
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(entity)
                uow.commit()
                return Result.success(entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create {entity_name.lower()}: {{str(e)}}")
"""

def _generate_entity_fields_mapping(entity_name: str, operation: str) -> str:
    """Generate field mapping code for entity creation/update"""
    lines = []
    return "                    # Fields will be mapped here\n"
    
def generate_update_command(domain: str, entity_name: str, fields: Dict[str, Tuple[str, bool]]) -> str:
    """Generate Update command file"""
    entity_id_field = f"{entity_name.lower()}_id"
    command_fields = [
        f"tenant_id: str",
        f"{entity_id_field}: str"
    ]
    
    for field_name, (field_type, is_optional) in fields.items():
        if field_name in ['tenant_id', 'id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']:
            continue
        
        python_type = {
            'UUID': 'str',
            'String': 'str',
            'Integer': 'int',
            'Float': 'float',
            'Boolean': 'bool',
            'DateTime': 'datetime',
            'Date': 'date',
            'JSON': 'List[str]'
        }.get(field_type, 'str')
        
        command_fields.append(f"    {field_name}: Optional[{python_type}] = None")
    
    return f"""from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class Update{entity_name}Command(ICommand):
{chr(10).join(command_fields)}
"""

def generate_update_handler(domain: str, entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate Update handler file"""
    entity_id_field = f"{entity_name.lower()}_id"
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
                
                entity = repo.get_by_id(command.{entity_id_field}, command.tenant_id)
                if not entity:
                    return Result.failure("{entity_name} not found")
                
                # Update fields here - following pattern from existing handlers
                # Each field should be checked: if command.field_name is not None: entity.field_name = command.field_name
                
                entity.updatedAt = datetime.utcnow()
                repo.update(entity)
                uow.commit()
                
                return Result.success(entity)
                
        except Exception as e:
            return Result.failure(f"Failed to update {entity_name.lower()}: {{str(e)}}")
"""

def generate_delete_command(domain: str, entity_name: str) -> str:
    """Generate Delete command file"""
    entity_id_field = f"{entity_name.lower()}_id"
    return f"""from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class Delete{entity_name}Command(ICommand):
    tenant_id: str
    {entity_id_field}: str
"""

def generate_delete_handler(domain: str, entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate Delete handler file"""
    entity_id_field = f"{entity_name.lower()}_id"
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
                
                entity = repo.get_by_id(command.{entity_id_field}, command.tenant_id)
                if not entity:
                    return Result.failure("{entity_name} not found")
                
                repo.delete(entity)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete {entity_name.lower()}: {{str(e)}}")
"""

def generate_get_by_id_query(domain: str, entity_name: str) -> str:
    """Generate GetById query file"""
    entity_id_field = f"{entity_name.lower()}_id"
    return f"""from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class Get{entity_name}ByIdQuery(IQuery):
    tenant_id: str
    {entity_id_field}: str
"""

def generate_get_by_id_handler(domain: str, entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate GetById handler file"""
    entity_id_field = f"{entity_name.lower()}_id"
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
                entity = repo.get_by_id(query.{entity_id_field}, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get {entity_name.lower()}: {{str(e)}}")
"""

def generate_get_all_query(domain: str, entity_name: str) -> str:
    """Generate GetAll query file"""
    return f"""from dataclasses import dataclass
from typing import Optional

@dataclass
class GetAll{entity_name}sQuery:
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

def generate_get_all_handler(domain: str, entity_name: str, repo_class: str, entity_module: str) -> str:
    """Generate GetAll handler file"""
    return f"""from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo_class}
from ....domain.entities.{entity_module} import {entity_name}
from .query import GetAll{entity_name}sQuery

class GetAll{entity_name}sHandler(RequestHandlerBase[GetAll{entity_name}sQuery, Result[PagedResult[{entity_name}]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAll{entity_name}sQuery) -> Result[PagedResult[{entity_name}]]:
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

def create_file_structure(domain: str, entity_name: str, entity_display: str, repo_class: str, entity_module: str):
    """Create complete command/query structure for an entity"""
    entity_lower = entity_name.lower()
    fields = get_entity_fields(entity_module, entity_name)
    
    commands_dir = BASE_DIR / 'application' / 'commands' / domain
    queries_dir = BASE_DIR / 'application' / 'queries' / domain
    
    for operation in ['create', 'update', 'delete']:
        op_dir = commands_dir / f"{operation}_{entity_lower}"
        op_dir.mkdir(parents=True, exist_ok=True)
        
        if operation == 'create':
            with open(op_dir / 'command.py', 'w') as f:
                f.write(generate_create_command(domain, entity_name, fields))
            with open(op_dir / 'handler.py', 'w') as f:
                f.write(generate_create_handler(domain, entity_name, repo_class, entity_module))
        elif operation == 'update':
            with open(op_dir / 'command.py', 'w') as f:
                f.write(generate_update_command(domain, entity_name, fields))
            with open(op_dir / 'handler.py', 'w') as f:
                f.write(generate_update_handler(domain, entity_name, repo_class, entity_module))
        elif operation == 'delete':
            with open(op_dir / 'command.py', 'w') as f:
                f.write(generate_delete_command(domain, entity_name))
            with open(op_dir / 'handler.py', 'w') as f:
                f.write(generate_delete_handler(domain, entity_name, repo_class, entity_module))
    
    for query_type in ['get_by_id', 'get_all']:
        query_name = f"get_{entity_lower}_by_id" if query_type == 'get_by_id' else f"get_all_{entity_lower}s"
        query_dir = queries_dir / query_name
        query_dir.mkdir(parents=True, exist_ok=True)
        
        if query_type == 'get_by_id':
            with open(query_dir / 'query.py', 'w') as f:
                f.write(generate_get_by_id_query(domain, entity_name))
            with open(query_dir / 'handler.py', 'w') as f:
                f.write(generate_get_by_id_handler(domain, entity_name, repo_class, entity_module))
        else:
            with open(query_dir / 'query.py', 'w') as f:
                f.write(generate_get_all_query(domain, entity_name))
            with open(query_dir / 'handler.py', 'w') as f:
                f.write(generate_get_all_handler(domain, entity_name, repo_class, entity_module))

def main():
    """Generate all command and query structures"""
    print("Starting Phase 4 generation...")
    print(f"Total entities to process: {len(ENTITY_CONFIGS)}")
    
    for idx, (domain, entity_name, entity_display, repo_class, entity_module) in enumerate(ENTITY_CONFIGS, 1):
        try:
            print(f"[{idx}/{len(ENTITY_CONFIGS)}] Processing {domain}.{entity_name}...")
            create_file_structure(domain, entity_name, entity_display, repo_class, entity_module)
            print(f"  ✓ Created structure for {domain}.{entity_name}")
        except Exception as e:
            print(f"  ✗ Error processing {domain}.{entity_name}: {e}")
    
    print("\nGeneration complete!")
    print("\n⚠️  IMPORTANT: You need to:")
    print("1. Review generated handlers and complete field mappings")
    print("2. Add validation logic where needed")
    print("3. Update __init__.py files to export new commands/queries")
    print("4. Test each command/query handler")

if __name__ == '__main__':
    main()

