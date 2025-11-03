from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContactRepository
from ....domain.entities.crm_entity import Contact
from .command import UpdateContactCommand

class UpdateContactHandler(RequestHandlerBase[UpdateContactCommand, Result[Contact]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateContactCommand) -> Result[Contact]:
        try:
            with self._unit_of_work as uow:
                repo = ContactRepository(uow.session)
                
                contact = repo.get_by_id(command.contact_id, command.tenant_id)
                if not contact:
                    return Result.failure("Contact not found")
                
                                if command.companyId is not None:
                    contact.companyId = uuid.UUID(command.companyId) if command.companyId else None
                if command.contactSource is not None:
                    contact.contactSource = command.contactSource
                if command.department is not None:
                    contact.department = command.department
                if command.email is not None:
                    contact.email = command.email.lower() if command.email else None
                if command.firstName is not None:
                    contact.firstName = command.firstName
                if command.isActive is not None:
                    contact.isActive = command.isActive
                if command.jobTitle is not None:
                    contact.jobTitle = command.jobTitle
                if command.lastName is not None:
                    contact.lastName = command.lastName
                if command.mobile is not None:
                    contact.mobile = command.mobile
                if command.notes is not None:
                    contact.notes = command.notes
                if command.phone is not None:
                    contact.phone = command.phone
                
                contact.updatedAt = datetime.utcnow()
                repo.update(contact)
                uow.commit()
                
                return Result.success(contact)
                
        except Exception as e:
            return Result.failure(f"Failed to update contact: {str(e)}")
