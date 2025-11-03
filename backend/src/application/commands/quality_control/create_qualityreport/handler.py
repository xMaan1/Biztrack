from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityReportRepository
from ....domain.entities.quality_control_entity import QualityReport
from .command import CreateQualityReportCommand

class CreateQualityReportHandler(RequestHandlerBase[CreateQualityReportCommand, Result[QualityReport]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateQualityReportCommand) -> Result[QualityReport]:
        try:
            with self._unit_of_work as uow:
                repo = QualityReportRepository(uow.session)
                
                qualityreport = QualityReport(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    generated_by_id=uuid.UUID(command.generated_by_id),
                    key_findings=command.key_findings or [],
                    metrics=command.metrics or [],
                    period_end=datetime.fromisoformat(command.period_end.replace('Z', '+00:00')) if command.period_end else datetime.utcnow(),
                    period_start=datetime.fromisoformat(command.period_start.replace('Z', '+00:00')) if command.period_start else datetime.utcnow(),
                    recommendations=command.recommendations or [],
                    report_number=command.report_number,
                    report_type=command.report_type,
                    summary=command.summary,
                    tags=command.tags or [],
                    title=command.title,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(qualityreport)
                uow.commit()
                return Result.success(qualityreport)
                
        except Exception as e:
            return Result.failure(f"Failed to create qualityreport: {str(e)}")
