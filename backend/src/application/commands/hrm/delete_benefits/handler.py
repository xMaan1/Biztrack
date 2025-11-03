from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BenefitsRepository
from .command import DeleteBenefitsCommand

class DeleteBenefitsHandler(RequestHandlerBase[DeleteBenefitsCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteBenefitsCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = BenefitsRepository(uow.session)
                
                benefits = repo.get_by_id(command.benefits_id, command.tenant_id)
                if not benefits:
                    return Result.failure("Benefits not found")
                
                repo.delete(benefits)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete benefits: {str(e)}")
