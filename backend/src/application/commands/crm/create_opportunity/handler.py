from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import OpportunityRepository
from ....domain.entities.crm_entity import Opportunity
from .command import CreateOpportunityCommand

class CreateOpportunityHandler(RequestHandlerBase[CreateOpportunityCommand, Result[Opportunity]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateOpportunityCommand) -> Result[Opportunity]:
        try:
            with self._unit_of_work as uow:
                repo = OpportunityRepository(uow.session)
                
                opportunity = Opportunity(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount=command.amount,
                    assignedToId=uuid.UUID(command.assignedToId),
                    companyId=uuid.UUID(command.companyId),
                    contactId=uuid.UUID(command.contactId),
                    description=command.description,
                    expectedCloseDate=datetime.fromisoformat(command.expectedCloseDate.replace('Z', '+00:00')) if command.expectedCloseDate else datetime.utcnow(),
                    leadSource=command.leadSource,
                    name=command.name,
                    notes=command.notes,
                    probability=command.probability,
                    stage=command.stage,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(opportunity)
                uow.commit()
                return Result.success(opportunity)
                
        except Exception as e:
            return Result.failure(f"Failed to create opportunity: {str(e)}")
