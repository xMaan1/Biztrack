from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityInspectionRepository
from ....domain.entities.quality_control_entity import QualityInspection
from .command import UpdateQualityInspectionCommand

class UpdateQualityInspectionHandler(RequestHandlerBase[UpdateQualityInspectionCommand, Result[QualityInspection]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateQualityInspectionCommand) -> Result[QualityInspection]:
        try:
            with self._unit_of_work as uow:
                repo = QualityInspectionRepository(uow.session)
                
                qualityinspection = repo.get_by_id(command.qualityinspection_id, command.tenant_id)
                if not qualityinspection:
                    return Result.failure("QualityInspection not found")
                
                                if command.compliance_score is not None:
                    qualityinspection.compliance_score = command.compliance_score
                if command.corrective_actions is not None:
                    qualityinspection.corrective_actions = command.corrective_actions or []
                if command.defects_found is not None:
                    qualityinspection.defects_found = command.defects_found or []
                if command.documents is not None:
                    qualityinspection.documents = command.documents or []
                if command.inspection_date is not None:
                    qualityinspection.inspection_date = datetime.fromisoformat(command.inspection_date.replace('Z', '+00:00')) if command.inspection_date else None
                if command.inspector_id is not None:
                    qualityinspection.inspector_id = uuid.UUID(command.inspector_id) if command.inspector_id else None
                if command.measurements is not None:
                    qualityinspection.measurements = command.measurements or []
                if command.notes is not None:
                    qualityinspection.notes = command.notes
                if command.photos is not None:
                    qualityinspection.photos = command.photos or []
                if command.quality_check_id is not None:
                    qualityinspection.quality_check_id = uuid.UUID(command.quality_check_id) if command.quality_check_id else None
                if command.results is not None:
                    qualityinspection.results = command.results or []
                if command.status is not None:
                    qualityinspection.status = command.status
                
                qualityinspection.updatedAt = datetime.utcnow()
                repo.update(qualityinspection)
                uow.commit()
                
                return Result.success(qualityinspection)
                
        except Exception as e:
            return Result.failure(f"Failed to update qualityinspection: {str(e)}")
