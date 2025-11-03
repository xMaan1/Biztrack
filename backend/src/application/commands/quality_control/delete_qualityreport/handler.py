from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityReportRepository
from .command import DeleteQualityReportCommand

class DeleteQualityReportHandler(RequestHandlerBase[DeleteQualityReportCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteQualityReportCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = QualityReportRepository(uow.session)
                
                qualityreport = repo.get_by_id(command.qualityreport_id, command.tenant_id)
                if not qualityreport:
                    return Result.failure("QualityReport not found")
                
                repo.delete(qualityreport)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete qualityreport: {str(e)}")
