from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionPlanRepository
from ....domain.entities.production_entity import ProductionPlan
from .command import CreateProductionPlanCommand

class CreateProductionPlanHandler(RequestHandlerBase[CreateProductionPlanCommand, Result[ProductionPlan]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateProductionPlanCommand) -> Result[ProductionPlan]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionPlanRepository(uow.session)
                
                productionplan = ProductionPlan(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_duration_hours=command.actual_duration_hours,
                    actual_end_date=datetime.fromisoformat(command.actual_end_date.replace('Z', '+00:00')) if command.actual_end_date else datetime.utcnow(),
                    actual_labor_cost=command.actual_labor_cost,
                    actual_material_cost=command.actual_material_cost,
                    actual_quantity=command.actual_quantity,
                    actual_start_date=datetime.fromisoformat(command.actual_start_date.replace('Z', '+00:00')) if command.actual_start_date else datetime.utcnow(),
                    approved_by_id=uuid.UUID(command.approved_by_id),
                    assigned_to_id=uuid.UUID(command.assigned_to_id),
                    completion_percentage=command.completion_percentage,
                    created_by_id=uuid.UUID(command.created_by_id),
                    current_step=command.current_step,
                    description=command.description,
                    equipment_required=command.equipment_required or [],
                    estimated_duration_hours=command.estimated_duration_hours,
                    estimated_labor_cost=command.estimated_labor_cost,
                    estimated_material_cost=command.estimated_material_cost,
                    inspection_points=command.inspection_points or [],
                    labor_requirements=command.labor_requirements or [],
                    materials_required=command.materials_required or [],
                    notes=command.notes or [],
                    plan_number=command.plan_number,
                    planned_end_date=datetime.fromisoformat(command.planned_end_date.replace('Z', '+00:00')) if command.planned_end_date else datetime.utcnow(),
                    planned_start_date=datetime.fromisoformat(command.planned_start_date.replace('Z', '+00:00')) if command.planned_start_date else datetime.utcnow(),
                    priority=command.priority,
                    production_line=command.production_line,
                    production_type=command.production_type,
                    project_id=uuid.UUID(command.project_id),
                    quality_standards=command.quality_standards,
                    status=command.status,
                    tags=command.tags or [],
                    target_quantity=command.target_quantity,
                    title=command.title,
                    tolerance_specs=command.tolerance_specs or [],
                    unit_of_measure=command.unit_of_measure,
                    work_order_id=uuid.UUID(command.work_order_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(productionplan)
                uow.commit()
                return Result.success(productionplan)
                
        except Exception as e:
            return Result.failure(f"Failed to create productionplan: {str(e)}")
