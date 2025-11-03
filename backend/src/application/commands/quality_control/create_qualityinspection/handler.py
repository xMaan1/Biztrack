from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityInspectionRepository
from ....domain.entities.quality_control_entity import QualityInspection
from .command import CreateQualityInspectionCommand

class CreateQualityInspectionHandler(RequestHandlerBase[CreateQualityInspectionCommand, Result[QualityInspection]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateQualityInspectionCommand) -> Result[QualityInspection]:
        try:
            with self._unit_of_work as uow:
                repo = QualityInspectionRepository(uow.session)
                
                qualityinspection = QualityInspection(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    compliance_score=command.compliance_score,
                    corrective_actions=command.corrective_actions or [],
                    defects_found=command.defects_found or [],
                    documents=command.documents or [],
                    inspection_date=datetime.fromisoformat(command.inspection_date.replace('Z', '+00:00')) if command.inspection_date else datetime.utcnow(),
                    inspector_id=uuid.UUID(command.inspector_id),
                    measurements=command.measurements or [],
                    notes=command.notes,
                    photos=command.photos or [],
                    quality_check_id=uuid.UUID(command.quality_check_id),
                    results=command.results or [],
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(qualityinspection)
                uow.commit()
                return Result.success(qualityinspection)
                
        except Exception as e:
            return Result.failure(f"Failed to create qualityinspection: {str(e)}")
