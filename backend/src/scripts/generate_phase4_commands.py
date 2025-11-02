"""
Script to generate Phase 4 Commands and Queries for all entities.
This script creates the command/query files following the established pattern.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

ENTITIES_CONFIG = [
    # (domain, entity_name, entity_class, repo_class, has_unique_field, unique_field_name)
    ('hrm', 'JobPosting', 'JobPosting', 'JobPostingRepository', False, None),
    ('hrm', 'Supplier', 'Supplier', 'SupplierRepository', True, 'code'),
    ('hrm', 'Training', 'Training', 'TrainingRepository', False, None),
    ('hrm', 'LeaveRequest', 'LeaveRequest', 'LeaveRequestRepository', False, None),
    ('crm', 'Lead', 'Lead', 'LeadRepository', False, None),
    ('crm', 'Contact', 'Contact', 'ContactRepository', False, None),
    ('crm', 'Company', 'Company', 'CompanyRepository', False, None),
    ('crm', 'Opportunity', 'Opportunity', 'OpportunityRepository', False, None),
    ('sales', 'Quote', 'Quote', 'QuoteRepository', False, None),
    ('sales', 'Contract', 'Contract', 'ContractRepository', False, None),
    ('invoice', 'Invoice', 'Invoice', 'InvoiceRepository', False, None),
    ('invoice', 'Payment', 'Payment', 'PaymentRepository', False, None),
    ('workshop', 'WorkOrder', 'WorkOrder', 'WorkOrderRepository', False, None),
    ('production', 'ProductionPlan', 'ProductionPlan', 'ProductionPlanRepository', False, None),
    ('event', 'Event', 'Event', 'EventRepository', False, None),
    ('banking', 'BankTransaction', 'BankTransaction', 'BankTransactionRepository', False, None),
    ('banking', 'TillTransaction', 'TillTransaction', 'TillTransactionRepository', False, None),
]

COMMAND_TEMPLATE = '''from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class Create{entity}Command(ICommand):
    tenant_id: str
    # Add required fields here based on entity
    created_by: str = None
'''

HANDLER_TEMPLATE = '''from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import {repo}
from ....domain.entities.{domain}_entity import {entity}
from .command import Create{entity}Command

class Create{entity}Handler(RequestHandlerBase[Create{entity}Command, Result[{entity}]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: Create{entity}Command) -> Result[{entity}]:
        try:
            with self._unit_of_work as uow:
                repo = {repo}(uow.session)
                # TODO: Implement entity creation logic
                return Result.failure("Not yet implemented")
        except Exception as e:
            return Result.failure(f"Failed to create {entity.lower()}: {{str(e)}}")
'''

def create_command_structure(domain, entity, repo_class):
    """Create command directory structure and files"""
    cmd_dir = BASE_DIR / 'application' / 'commands' / domain / f'create_{entity.lower()}'
    cmd_dir.mkdir(parents=True, exist_ok=True)
    
    command_file = cmd_dir / 'command.py'
    handler_file = cmd_dir / 'handler.py'
    
    with open(command_file, 'w') as f:
        f.write(COMMAND_TEMPLATE.format(entity=entity))
    
    with open(handler_file, 'w') as f:
        f.write(HANDLER_TEMPLATE.format(
            entity=entity,
            repo=repo_class,
            domain=domain
        ))

def main():
    """Generate all command structures"""
    for domain, entity_name, entity_class, repo_class, has_unique, unique_field in ENTITIES_CONFIG:
        create_command_structure(domain, entity_name, repo_class)
        print(f"Created structure for {domain}.{entity_name}")

if __name__ == '__main__':
    main()

