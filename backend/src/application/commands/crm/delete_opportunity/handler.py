from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import OpportunityRepository
from .command import DeleteOpportunityCommand

class DeleteOpportunityHandler(RequestHandlerBase[DeleteOpportunityCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteOpportunityCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = OpportunityRepository(uow.session)
                
                opportunity = repo.get_by_id(command.opportunity_id, command.tenant_id)
                if not opportunity:
                    return Result.failure("Opportunity not found")
                
                repo.delete(opportunity)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete opportunity: {str(e)}")
