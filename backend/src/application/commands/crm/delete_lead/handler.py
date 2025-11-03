from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeadRepository
from .command import DeleteLeadCommand

class DeleteLeadHandler(RequestHandlerBase[DeleteLeadCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteLeadCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = LeadRepository(uow.session)
                
                lead = repo.get_by_id(command.lead_id, command.tenant_id)
                if not lead:
                    return Result.failure("Lead not found")
                
                repo.delete(lead)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete lead: {str(e)}")
