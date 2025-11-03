from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityDefectRepository
from .command import DeleteQualityDefectCommand

class DeleteQualityDefectHandler(RequestHandlerBase[DeleteQualityDefectCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteQualityDefectCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = QualityDefectRepository(uow.session)
                
                qualitydefect = repo.get_by_id(command.qualitydefect_id, command.tenant_id)
                if not qualitydefect:
                    return Result.failure("QualityDefect not found")
                
                repo.delete(qualitydefect)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete qualitydefect: {str(e)}")
