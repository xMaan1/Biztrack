from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import OpportunityRepository
from ....domain.entities.crm_entity import Opportunity
from .command import UpdateOpportunityCommand

class UpdateOpportunityHandler(RequestHandlerBase[UpdateOpportunityCommand, Result[Opportunity]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateOpportunityCommand) -> Result[Opportunity]:
        try:
            with self._unit_of_work as uow:
                repo = OpportunityRepository(uow.session)
                
                opportunity = repo.get_by_id(command.opportunity_id, command.tenant_id)
                if not opportunity:
                    return Result.failure("Opportunity not found")
                
                                if command.amount is not None:
                    opportunity.amount = command.amount
                if command.assignedToId is not None:
                    opportunity.assignedToId = uuid.UUID(command.assignedToId) if command.assignedToId else None
                if command.companyId is not None:
                    opportunity.companyId = uuid.UUID(command.companyId) if command.companyId else None
                if command.contactId is not None:
                    opportunity.contactId = uuid.UUID(command.contactId) if command.contactId else None
                if command.description is not None:
                    opportunity.description = command.description
                if command.expectedCloseDate is not None:
                    opportunity.expectedCloseDate = datetime.fromisoformat(command.expectedCloseDate.replace('Z', '+00:00')) if command.expectedCloseDate else None
                if command.leadSource is not None:
                    opportunity.leadSource = command.leadSource
                if command.name is not None:
                    opportunity.name = command.name
                if command.notes is not None:
                    opportunity.notes = command.notes
                if command.probability is not None:
                    opportunity.probability = command.probability
                if command.stage is not None:
                    opportunity.stage = command.stage
                
                opportunity.updatedAt = datetime.utcnow()
                repo.update(opportunity)
                uow.commit()
                
                return Result.success(opportunity)
                
        except Exception as e:
            return Result.failure(f"Failed to update opportunity: {str(e)}")
