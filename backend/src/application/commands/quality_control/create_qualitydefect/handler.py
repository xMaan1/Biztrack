from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityDefectRepository
from ....domain.entities.quality_control_entity import QualityDefect
from .command import CreateQualityDefectCommand

class CreateQualityDefectHandler(RequestHandlerBase[CreateQualityDefectCommand, Result[QualityDefect]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateQualityDefectCommand) -> Result[QualityDefect]:
        try:
            with self._unit_of_work as uow:
                repo = QualityDefectRepository(uow.session)
                
                qualitydefect = QualityDefect(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_resolution_date=datetime.fromisoformat(command.actual_resolution_date.replace('Z', '+00:00')) if command.actual_resolution_date else datetime.utcnow(),
                    assigned_to_id=uuid.UUID(command.assigned_to_id),
                    category=command.category,
                    cost_impact=command.cost_impact,
                    defect_number=command.defect_number,
                    description=command.description,
                    detected_by_id=uuid.UUID(command.detected_by_id),
                    detected_date=datetime.fromisoformat(command.detected_date.replace('Z', '+00:00')) if command.detected_date else datetime.utcnow(),
                    estimated_resolution_date=datetime.fromisoformat(command.estimated_resolution_date.replace('Z', '+00:00')) if command.estimated_resolution_date else datetime.utcnow(),
                    location=command.location,
                    priority=command.priority,
                    production_plan_id=uuid.UUID(command.production_plan_id),
                    project_id=uuid.UUID(command.project_id),
                    quality_check_id=uuid.UUID(command.quality_check_id),
                    resolution_notes=command.resolution_notes,
                    severity=command.severity,
                    status=command.status,
                    tags=command.tags or [],
                    title=command.title,
                    work_order_id=uuid.UUID(command.work_order_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(qualitydefect)
                uow.commit()
                return Result.success(qualitydefect)
                
        except Exception as e:
            return Result.failure(f"Failed to create qualitydefect: {str(e)}")
