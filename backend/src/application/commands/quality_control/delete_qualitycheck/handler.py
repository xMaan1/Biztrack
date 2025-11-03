from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityCheckRepository
from .command import DeleteQualityCheckCommand

class DeleteQualityCheckHandler(RequestHandlerBase[DeleteQualityCheckCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteQualityCheckCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = QualityCheckRepository(uow.session)
                
                qualitycheck = repo.get_by_id(command.qualitycheck_id, command.tenant_id)
                if not qualitycheck:
                    return Result.failure("QualityCheck not found")
                
                repo.delete(qualitycheck)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete qualitycheck: {str(e)}")
