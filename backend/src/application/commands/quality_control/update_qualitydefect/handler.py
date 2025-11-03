from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityDefectRepository
from ....domain.entities.quality_control_entity import QualityDefect
from .command import UpdateQualityDefectCommand

class UpdateQualityDefectHandler(RequestHandlerBase[UpdateQualityDefectCommand, Result[QualityDefect]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateQualityDefectCommand) -> Result[QualityDefect]:
        try:
            with self._unit_of_work as uow:
                repo = QualityDefectRepository(uow.session)
                
                qualitydefect = repo.get_by_id(command.qualitydefect_id, command.tenant_id)
                if not qualitydefect:
                    return Result.failure("QualityDefect not found")
                
                                if command.actual_resolution_date is not None:
                    qualitydefect.actual_resolution_date = datetime.fromisoformat(command.actual_resolution_date.replace('Z', '+00:00')) if command.actual_resolution_date else None
                if command.assigned_to_id is not None:
                    qualitydefect.assigned_to_id = uuid.UUID(command.assigned_to_id) if command.assigned_to_id else None
                if command.category is not None:
                    qualitydefect.category = command.category
                if command.cost_impact is not None:
                    qualitydefect.cost_impact = command.cost_impact
                if command.defect_number is not None:
                    qualitydefect.defect_number = command.defect_number
                if command.description is not None:
                    qualitydefect.description = command.description
                if command.detected_by_id is not None:
                    qualitydefect.detected_by_id = uuid.UUID(command.detected_by_id) if command.detected_by_id else None
                if command.detected_date is not None:
                    qualitydefect.detected_date = datetime.fromisoformat(command.detected_date.replace('Z', '+00:00')) if command.detected_date else None
                if command.estimated_resolution_date is not None:
                    qualitydefect.estimated_resolution_date = datetime.fromisoformat(command.estimated_resolution_date.replace('Z', '+00:00')) if command.estimated_resolution_date else None
                if command.location is not None:
                    qualitydefect.location = command.location
                if command.priority is not None:
                    qualitydefect.priority = command.priority
                if command.production_plan_id is not None:
                    qualitydefect.production_plan_id = uuid.UUID(command.production_plan_id) if command.production_plan_id else None
                if command.project_id is not None:
                    qualitydefect.project_id = uuid.UUID(command.project_id) if command.project_id else None
                if command.quality_check_id is not None:
                    qualitydefect.quality_check_id = uuid.UUID(command.quality_check_id) if command.quality_check_id else None
                if command.resolution_notes is not None:
                    qualitydefect.resolution_notes = command.resolution_notes
                if command.severity is not None:
                    qualitydefect.severity = command.severity
                if command.status is not None:
                    qualitydefect.status = command.status
                if command.tags is not None:
                    qualitydefect.tags = command.tags or []
                if command.title is not None:
                    qualitydefect.title = command.title
                if command.work_order_id is not None:
                    qualitydefect.work_order_id = uuid.UUID(command.work_order_id) if command.work_order_id else None
                
                qualitydefect.updatedAt = datetime.utcnow()
                repo.update(qualitydefect)
                uow.commit()
                
                return Result.success(qualitydefect)
                
        except Exception as e:
            return Result.failure(f"Failed to update qualitydefect: {str(e)}")
