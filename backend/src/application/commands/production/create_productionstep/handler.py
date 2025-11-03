from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionStepRepository
from ....domain.entities.production_entity import ProductionStep
from .command import CreateProductionStepCommand

class CreateProductionStepHandler(RequestHandlerBase[CreateProductionStepCommand, Result[ProductionStep]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateProductionStepCommand) -> Result[ProductionStep]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionStepRepository(uow.session)
                
                productionstep = ProductionStep(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_duration_minutes=command.actual_duration_minutes,
                    depends_on_steps=command.depends_on_steps or [],
                    description=command.description,
                    equipment_required=command.equipment_required or [],
                    estimated_duration_minutes=command.estimated_duration_minutes,
                    inspection_required=command.inspection_required,
                    labor_required=command.labor_required or [],
                    materials_consumed=command.materials_consumed or [],
                    notes=command.notes,
                    production_plan_id=uuid.UUID(command.production_plan_id),
                    quality_checkpoints=command.quality_checkpoints or [],
                    status=command.status,
                    step_name=command.step_name,
                    step_number=command.step_number,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(productionstep)
                uow.commit()
                return Result.success(productionstep)
                
        except Exception as e:
            return Result.failure(f"Failed to create productionstep: {str(e)}")
