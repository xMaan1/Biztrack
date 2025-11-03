from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionScheduleRepository
from ....domain.entities.production_entity import ProductionSchedule
from .command import CreateProductionScheduleCommand

class CreateProductionScheduleHandler(RequestHandlerBase[CreateProductionScheduleCommand, Result[ProductionSchedule]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateProductionScheduleCommand) -> Result[ProductionSchedule]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionScheduleRepository(uow.session)
                
                productionschedule = ProductionSchedule(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    capacity_utilization=command.capacity_utilization,
                    constraints=command.constraints or [],
                    dependencies=command.dependencies or [],
                    production_plan_id=uuid.UUID(command.production_plan_id),
                    resource_allocation=command.resource_allocation or [],
                    scheduled_end=datetime.fromisoformat(command.scheduled_end.replace('Z', '+00:00')) if command.scheduled_end else datetime.utcnow(),
                    scheduled_start=datetime.fromisoformat(command.scheduled_start.replace('Z', '+00:00')) if command.scheduled_start else datetime.utcnow(),
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(productionschedule)
                uow.commit()
                return Result.success(productionschedule)
                
        except Exception as e:
            return Result.failure(f"Failed to create productionschedule: {str(e)}")
