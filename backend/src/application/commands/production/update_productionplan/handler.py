from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionPlanRepository
from ....domain.entities.production_entity import ProductionPlan
from .command import UpdateProductionPlanCommand

class UpdateProductionPlanHandler(RequestHandlerBase[UpdateProductionPlanCommand, Result[ProductionPlan]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateProductionPlanCommand) -> Result[ProductionPlan]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionPlanRepository(uow.session)
                
                productionplan = repo.get_by_id(command.productionplan_id, command.tenant_id)
                if not productionplan:
                    return Result.failure("ProductionPlan not found")
                
                                if command.actual_duration_hours is not None:
                    productionplan.actual_duration_hours = command.actual_duration_hours
                if command.actual_end_date is not None:
                    productionplan.actual_end_date = datetime.fromisoformat(command.actual_end_date.replace('Z', '+00:00')) if command.actual_end_date else None
                if command.actual_labor_cost is not None:
                    productionplan.actual_labor_cost = command.actual_labor_cost
                if command.actual_material_cost is not None:
                    productionplan.actual_material_cost = command.actual_material_cost
                if command.actual_quantity is not None:
                    productionplan.actual_quantity = command.actual_quantity
                if command.actual_start_date is not None:
                    productionplan.actual_start_date = datetime.fromisoformat(command.actual_start_date.replace('Z', '+00:00')) if command.actual_start_date else None
                if command.approved_by_id is not None:
                    productionplan.approved_by_id = uuid.UUID(command.approved_by_id) if command.approved_by_id else None
                if command.assigned_to_id is not None:
                    productionplan.assigned_to_id = uuid.UUID(command.assigned_to_id) if command.assigned_to_id else None
                if command.completion_percentage is not None:
                    productionplan.completion_percentage = command.completion_percentage
                if command.created_by_id is not None:
                    productionplan.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.current_step is not None:
                    productionplan.current_step = command.current_step
                if command.description is not None:
                    productionplan.description = command.description
                if command.equipment_required is not None:
                    productionplan.equipment_required = command.equipment_required or []
                if command.estimated_duration_hours is not None:
                    productionplan.estimated_duration_hours = command.estimated_duration_hours
                if command.estimated_labor_cost is not None:
                    productionplan.estimated_labor_cost = command.estimated_labor_cost
                if command.estimated_material_cost is not None:
                    productionplan.estimated_material_cost = command.estimated_material_cost
                if command.inspection_points is not None:
                    productionplan.inspection_points = command.inspection_points or []
                if command.labor_requirements is not None:
                    productionplan.labor_requirements = command.labor_requirements or []
                if command.materials_required is not None:
                    productionplan.materials_required = command.materials_required or []
                if command.notes is not None:
                    productionplan.notes = command.notes or []
                if command.plan_number is not None:
                    productionplan.plan_number = command.plan_number
                if command.planned_end_date is not None:
                    productionplan.planned_end_date = datetime.fromisoformat(command.planned_end_date.replace('Z', '+00:00')) if command.planned_end_date else None
                if command.planned_start_date is not None:
                    productionplan.planned_start_date = datetime.fromisoformat(command.planned_start_date.replace('Z', '+00:00')) if command.planned_start_date else None
                if command.priority is not None:
                    productionplan.priority = command.priority
                if command.production_line is not None:
                    productionplan.production_line = command.production_line
                if command.production_type is not None:
                    productionplan.production_type = command.production_type
                if command.project_id is not None:
                    productionplan.project_id = uuid.UUID(command.project_id) if command.project_id else None
                if command.quality_standards is not None:
                    productionplan.quality_standards = command.quality_standards
                if command.status is not None:
                    productionplan.status = command.status
                if command.tags is not None:
                    productionplan.tags = command.tags or []
                if command.target_quantity is not None:
                    productionplan.target_quantity = command.target_quantity
                if command.title is not None:
                    productionplan.title = command.title
                if command.tolerance_specs is not None:
                    productionplan.tolerance_specs = command.tolerance_specs or []
                if command.unit_of_measure is not None:
                    productionplan.unit_of_measure = command.unit_of_measure
                if command.work_order_id is not None:
                    productionplan.work_order_id = uuid.UUID(command.work_order_id) if command.work_order_id else None
                
                productionplan.updatedAt = datetime.utcnow()
                repo.update(productionplan)
                uow.commit()
                
                return Result.success(productionplan)
                
        except Exception as e:
            return Result.failure(f"Failed to update productionplan: {str(e)}")
