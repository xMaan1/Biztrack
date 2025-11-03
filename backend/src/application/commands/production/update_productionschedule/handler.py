from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionScheduleRepository
from ....domain.entities.production_entity import ProductionSchedule
from .command import UpdateProductionScheduleCommand

class UpdateProductionScheduleHandler(RequestHandlerBase[UpdateProductionScheduleCommand, Result[ProductionSchedule]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateProductionScheduleCommand) -> Result[ProductionSchedule]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionScheduleRepository(uow.session)
                
                productionschedule = repo.get_by_id(command.productionschedule_id, command.tenant_id)
                if not productionschedule:
                    return Result.failure("ProductionSchedule not found")
                
                                if command.capacity_utilization is not None:
                    productionschedule.capacity_utilization = command.capacity_utilization
                if command.constraints is not None:
                    productionschedule.constraints = command.constraints or []
                if command.dependencies is not None:
                    productionschedule.dependencies = command.dependencies or []
                if command.production_plan_id is not None:
                    productionschedule.production_plan_id = uuid.UUID(command.production_plan_id) if command.production_plan_id else None
                if command.resource_allocation is not None:
                    productionschedule.resource_allocation = command.resource_allocation or []
                if command.scheduled_end is not None:
                    productionschedule.scheduled_end = datetime.fromisoformat(command.scheduled_end.replace('Z', '+00:00')) if command.scheduled_end else None
                if command.scheduled_start is not None:
                    productionschedule.scheduled_start = datetime.fromisoformat(command.scheduled_start.replace('Z', '+00:00')) if command.scheduled_start else None
                if command.status is not None:
                    productionschedule.status = command.status
                
                productionschedule.updatedAt = datetime.utcnow()
                repo.update(productionschedule)
                uow.commit()
                
                return Result.success(productionschedule)
                
        except Exception as e:
            return Result.failure(f"Failed to update productionschedule: {str(e)}")
