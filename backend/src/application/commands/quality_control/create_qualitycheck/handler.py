from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityCheckRepository
from ....domain.entities.quality_control_entity import QualityCheck
from .command import CreateQualityCheckCommand

class CreateQualityCheckHandler(RequestHandlerBase[CreateQualityCheckCommand, Result[QualityCheck]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateQualityCheckCommand) -> Result[QualityCheck]:
        try:
            with self._unit_of_work as uow:
                repo = QualityCheckRepository(uow.session)
                
                qualitycheck = QualityCheck(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    acceptance_criteria=command.acceptance_criteria or [],
                    assigned_to_id=uuid.UUID(command.assigned_to_id),
                    check_number=command.check_number,
                    completion_percentage=command.completion_percentage,
                    created_by_id=uuid.UUID(command.created_by_id),
                    criteria=command.criteria or [],
                    current_step=command.current_step,
                    description=command.description,
                    estimated_duration_minutes=command.estimated_duration_minutes,
                    inspection_type=command.inspection_type,
                    notes=command.notes or [],
                    priority=command.priority,
                    production_plan_id=uuid.UUID(command.production_plan_id),
                    project_id=uuid.UUID(command.project_id),
                    quality_standard=command.quality_standard,
                    required_equipment=command.required_equipment or [],
                    required_skills=command.required_skills or [],
                    scheduled_date=datetime.fromisoformat(command.scheduled_date.replace('Z', '+00:00')) if command.scheduled_date else datetime.utcnow(),
                    status=command.status,
                    tags=command.tags or [],
                    title=command.title,
                    tolerance_limits=command.tolerance_limits or [],
                    work_order_id=uuid.UUID(command.work_order_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(qualitycheck)
                uow.commit()
                return Result.success(qualitycheck)
                
        except Exception as e:
            return Result.failure(f"Failed to create qualitycheck: {str(e)}")
