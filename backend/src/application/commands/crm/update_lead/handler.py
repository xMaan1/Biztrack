from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeadRepository
from ....domain.entities.crm_entity import Lead
from .command import UpdateLeadCommand

class UpdateLeadHandler(RequestHandlerBase[UpdateLeadCommand, Result[Lead]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateLeadCommand) -> Result[Lead]:
        try:
            with self._unit_of_work as uow:
                repo = LeadRepository(uow.session)
                
                lead = repo.get_by_id(command.lead_id, command.tenant_id)
                if not lead:
                    return Result.failure("Lead not found")
                
                if command.assignedToId is not None:
                    lead.assignedToId = uuid.UUID(command.assignedToId) if command.assignedToId else None
                if command.company is not None:
                    lead.company = command.company
                if command.email is not None:
                    lead.email = command.email.lower() if command.email else None
                if command.firstName is not None:
                    lead.firstName = command.firstName
                if command.jobTitle is not None:
                    lead.jobTitle = command.jobTitle
                if command.lastName is not None:
                    lead.lastName = command.lastName
                if command.leadSource is not None:
                    lead.leadSource = command.leadSource
                if command.notes is not None:
                    lead.notes = command.notes
                if command.phone is not None:
                    lead.phone = command.phone
                if command.priority is not None:
                    lead.priority = command.priority
                if command.status is not None:
                    lead.status = command.status
                
                lead.updatedAt = datetime.utcnow()
                repo.update(lead)
                uow.commit()
                
                return Result.success(lead)
                
        except Exception as e:
            return Result.failure(f"Failed to update lead: {str(e)}")
