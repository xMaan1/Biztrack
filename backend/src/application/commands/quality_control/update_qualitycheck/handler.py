from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityCheckRepository
from ....domain.entities.quality_control_entity import QualityCheck
from .command import UpdateQualityCheckCommand

class UpdateQualityCheckHandler(RequestHandlerBase[UpdateQualityCheckCommand, Result[QualityCheck]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateQualityCheckCommand) -> Result[QualityCheck]:
        try:
            with self._unit_of_work as uow:
                repo = QualityCheckRepository(uow.session)
                
                qualitycheck = repo.get_by_id(command.qualitycheck_id, command.tenant_id)
                if not qualitycheck:
                    return Result.failure("QualityCheck not found")
                
                                if command.acceptance_criteria is not None:
                    qualitycheck.acceptance_criteria = command.acceptance_criteria or []
                if command.assigned_to_id is not None:
                    qualitycheck.assigned_to_id = uuid.UUID(command.assigned_to_id) if command.assigned_to_id else None
                if command.check_number is not None:
                    qualitycheck.check_number = command.check_number
                if command.completion_percentage is not None:
                    qualitycheck.completion_percentage = command.completion_percentage
                if command.created_by_id is not None:
                    qualitycheck.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.criteria is not None:
                    qualitycheck.criteria = command.criteria or []
                if command.current_step is not None:
                    qualitycheck.current_step = command.current_step
                if command.description is not None:
                    qualitycheck.description = command.description
                if command.estimated_duration_minutes is not None:
                    qualitycheck.estimated_duration_minutes = command.estimated_duration_minutes
                if command.inspection_type is not None:
                    qualitycheck.inspection_type = command.inspection_type
                if command.notes is not None:
                    qualitycheck.notes = command.notes or []
                if command.priority is not None:
                    qualitycheck.priority = command.priority
                if command.production_plan_id is not None:
                    qualitycheck.production_plan_id = uuid.UUID(command.production_plan_id) if command.production_plan_id else None
                if command.project_id is not None:
                    qualitycheck.project_id = uuid.UUID(command.project_id) if command.project_id else None
                if command.quality_standard is not None:
                    qualitycheck.quality_standard = command.quality_standard
                if command.required_equipment is not None:
                    qualitycheck.required_equipment = command.required_equipment or []
                if command.required_skills is not None:
                    qualitycheck.required_skills = command.required_skills or []
                if command.scheduled_date is not None:
                    qualitycheck.scheduled_date = datetime.fromisoformat(command.scheduled_date.replace('Z', '+00:00')) if command.scheduled_date else None
                if command.status is not None:
                    qualitycheck.status = command.status
                if command.tags is not None:
                    qualitycheck.tags = command.tags or []
                if command.title is not None:
                    qualitycheck.title = command.title
                if command.tolerance_limits is not None:
                    qualitycheck.tolerance_limits = command.tolerance_limits or []
                if command.work_order_id is not None:
                    qualitycheck.work_order_id = uuid.UUID(command.work_order_id) if command.work_order_id else None
                
                qualitycheck.updatedAt = datetime.utcnow()
                repo.update(qualitycheck)
                uow.commit()
                
                return Result.success(qualitycheck)
                
        except Exception as e:
            return Result.failure(f"Failed to update qualitycheck: {str(e)}")
