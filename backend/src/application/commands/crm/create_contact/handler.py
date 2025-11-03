from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContactRepository
from ....domain.entities.crm_entity import Contact
from .command import CreateContactCommand

class CreateContactHandler(RequestHandlerBase[CreateContactCommand, Result[Contact]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateContactCommand) -> Result[Contact]:
        try:
            with self._unit_of_work as uow:
                repo = ContactRepository(uow.session)
                
                contact = Contact(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    companyId=uuid.UUID(command.companyId),
                    contactSource=command.contactSource,
                    department=command.department,
                    email=command.email.lower() if command.email else None,
                    firstName=command.firstName,
                    isActive=command.isActive,
                    jobTitle=command.jobTitle,
                    lastName=command.lastName,
                    mobile=command.mobile,
                    notes=command.notes,
                    phone=command.phone,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(contact)
                uow.commit()
                return Result.success(contact)
                
        except Exception as e:
            return Result.failure(f"Failed to create contact: {str(e)}")
