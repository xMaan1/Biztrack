from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionStepRepository
from ....domain.entities.production_entity import ProductionStep
from .command import UpdateProductionStepCommand

class UpdateProductionStepHandler(RequestHandlerBase[UpdateProductionStepCommand, Result[ProductionStep]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateProductionStepCommand) -> Result[ProductionStep]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionStepRepository(uow.session)
                
                productionstep = repo.get_by_id(command.productionstep_id, command.tenant_id)
                if not productionstep:
                    return Result.failure("ProductionStep not found")
                
                                if command.actual_duration_minutes is not None:
                    productionstep.actual_duration_minutes = command.actual_duration_minutes
                if command.depends_on_steps is not None:
                    productionstep.depends_on_steps = command.depends_on_steps or []
                if command.description is not None:
                    productionstep.description = command.description
                if command.equipment_required is not None:
                    productionstep.equipment_required = command.equipment_required or []
                if command.estimated_duration_minutes is not None:
                    productionstep.estimated_duration_minutes = command.estimated_duration_minutes
                if command.inspection_required is not None:
                    productionstep.inspection_required = command.inspection_required
                if command.labor_required is not None:
                    productionstep.labor_required = command.labor_required or []
                if command.materials_consumed is not None:
                    productionstep.materials_consumed = command.materials_consumed or []
                if command.notes is not None:
                    productionstep.notes = command.notes
                if command.production_plan_id is not None:
                    productionstep.production_plan_id = uuid.UUID(command.production_plan_id) if command.production_plan_id else None
                if command.quality_checkpoints is not None:
                    productionstep.quality_checkpoints = command.quality_checkpoints or []
                if command.status is not None:
                    productionstep.status = command.status
                if command.step_name is not None:
                    productionstep.step_name = command.step_name
                if command.step_number is not None:
                    productionstep.step_number = command.step_number
                
                productionstep.updatedAt = datetime.utcnow()
                repo.update(productionstep)
                uow.commit()
                
                return Result.success(productionstep)
                
        except Exception as e:
            return Result.failure(f"Failed to update productionstep: {str(e)}")
