from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityReportRepository
from ....domain.entities.quality_control_entity import QualityReport
from .command import UpdateQualityReportCommand

class UpdateQualityReportHandler(RequestHandlerBase[UpdateQualityReportCommand, Result[QualityReport]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateQualityReportCommand) -> Result[QualityReport]:
        try:
            with self._unit_of_work as uow:
                repo = QualityReportRepository(uow.session)
                
                qualityreport = repo.get_by_id(command.qualityreport_id, command.tenant_id)
                if not qualityreport:
                    return Result.failure("QualityReport not found")
                
                                if command.generated_by_id is not None:
                    qualityreport.generated_by_id = uuid.UUID(command.generated_by_id) if command.generated_by_id else None
                if command.key_findings is not None:
                    qualityreport.key_findings = command.key_findings or []
                if command.metrics is not None:
                    qualityreport.metrics = command.metrics or []
                if command.period_end is not None:
                    qualityreport.period_end = datetime.fromisoformat(command.period_end.replace('Z', '+00:00')) if command.period_end else None
                if command.period_start is not None:
                    qualityreport.period_start = datetime.fromisoformat(command.period_start.replace('Z', '+00:00')) if command.period_start else None
                if command.recommendations is not None:
                    qualityreport.recommendations = command.recommendations or []
                if command.report_number is not None:
                    qualityreport.report_number = command.report_number
                if command.report_type is not None:
                    qualityreport.report_type = command.report_type
                if command.summary is not None:
                    qualityreport.summary = command.summary
                if command.tags is not None:
                    qualityreport.tags = command.tags or []
                if command.title is not None:
                    qualityreport.title = command.title
                
                qualityreport.updatedAt = datetime.utcnow()
                repo.update(qualityreport)
                uow.commit()
                
                return Result.success(qualityreport)
                
        except Exception as e:
            return Result.failure(f"Failed to update qualityreport: {str(e)}")
