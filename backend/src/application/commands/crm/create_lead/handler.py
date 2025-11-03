from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeadRepository
from ....domain.entities.crm_entity import Lead
from .command import CreateLeadCommand

class CreateLeadHandler(RequestHandlerBase[CreateLeadCommand, Result[Lead]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateLeadCommand) -> Result[Lead]:
        try:
            with self._unit_of_work as uow:
                repo = LeadRepository(uow.session)
                
                lead = Lead(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    firstName=command.firstName,
                    lastName=command.lastName,
                    email=command.email.lower() if command.email else None,
                    assignedToId=uuid.UUID(command.assignedToId) if command.assignedToId else None,
                    company=command.company,
                    jobTitle=command.jobTitle,
                    leadSource=command.leadSource,
                    notes=command.notes,
                    phone=command.phone,
                    priority=command.priority,
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(lead)
                uow.commit()
                return Result.success(lead)
                
        except Exception as e:
            return Result.failure(f"Failed to create lead: {str(e)}")
