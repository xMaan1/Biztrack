from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityInspectionRepository
from .command import DeleteQualityInspectionCommand

class DeleteQualityInspectionHandler(RequestHandlerBase[DeleteQualityInspectionCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteQualityInspectionCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = QualityInspectionRepository(uow.session)
                
                qualityinspection = repo.get_by_id(command.qualityinspection_id, command.tenant_id)
                if not qualityinspection:
                    return Result.failure("QualityInspection not found")
                
                repo.delete(qualityinspection)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete qualityinspection: {str(e)}")
