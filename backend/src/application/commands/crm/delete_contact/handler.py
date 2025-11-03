from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContactRepository
from .command import DeleteContactCommand

class DeleteContactHandler(RequestHandlerBase[DeleteContactCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteContactCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ContactRepository(uow.session)
                
                contact = repo.get_by_id(command.contact_id, command.tenant_id)
                if not contact:
                    return Result.failure("Contact not found")
                
                repo.delete(contact)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete contact: {str(e)}")
