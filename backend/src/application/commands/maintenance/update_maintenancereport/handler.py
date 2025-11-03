from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceReportRepository
from ....domain.entities.maintenance_entity import MaintenanceReport
from .command import UpdateMaintenanceReportCommand

class UpdateMaintenanceReportHandler(RequestHandlerBase[UpdateMaintenanceReportCommand, Result[MaintenanceReport]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateMaintenanceReportCommand) -> Result[MaintenanceReport]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceReportRepository(uow.session)
                
                maintenancereport = repo.get_by_id(command.maintenancereport_id, command.tenant_id)
                if not maintenancereport:
                    return Result.failure("MaintenanceReport not found")
                
                                if command.approval_status is not None:
                    maintenancereport.approval_status = command.approval_status
                if command.approved_by_id is not None:
                    maintenancereport.approved_by_id = uuid.UUID(command.approved_by_id) if command.approved_by_id else None
                if command.compliance_notes is not None:
                    maintenancereport.compliance_notes = command.compliance_notes or []
                if command.cost_breakdown is not None:
                    maintenancereport.cost_breakdown = command.cost_breakdown or []
                if command.created_by_id is not None:
                    maintenancereport.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.description is not None:
                    maintenancereport.description = command.description
                if command.documents is not None:
                    maintenancereport.documents = command.documents or []
                if command.efficiency_improvement is not None:
                    maintenancereport.efficiency_improvement = command.efficiency_improvement
                if command.equipment_id is not None:
                    maintenancereport.equipment_id = uuid.UUID(command.equipment_id) if command.equipment_id else None
                if command.issues_found is not None:
                    maintenancereport.issues_found = command.issues_found or []
                if command.maintenance_type is not None:
                    maintenancereport.maintenance_type = command.maintenance_type
                if command.maintenance_work_order_id is not None:
                    maintenancereport.maintenance_work_order_id = uuid.UUID(command.maintenance_work_order_id) if command.maintenance_work_order_id else None
                if command.next_maintenance_date is not None:
                    maintenancereport.next_maintenance_date = datetime.fromisoformat(command.next_maintenance_date.replace('Z', '+00:00')) if command.next_maintenance_date else None
                if command.parts_replaced is not None:
                    maintenancereport.parts_replaced = command.parts_replaced or []
                if command.photos is not None:
                    maintenancereport.photos = command.photos or []
                if command.recommendations is not None:
                    maintenancereport.recommendations = command.recommendations or []
                if command.report_date is not None:
                    maintenancereport.report_date = datetime.fromisoformat(command.report_date.replace('Z', '+00:00')) if command.report_date else None
                if command.safety_improvements is not None:
                    maintenancereport.safety_improvements = command.safety_improvements or []
                if command.technician_id is not None:
                    maintenancereport.technician_id = uuid.UUID(command.technician_id) if command.technician_id else None
                if command.title is not None:
                    maintenancereport.title = command.title
                if command.tools_used is not None:
                    maintenancereport.tools_used = command.tools_used or []
                if command.total_cost is not None:
                    maintenancereport.total_cost = command.total_cost
                if command.updated_by_id is not None:
                    maintenancereport.updated_by_id = uuid.UUID(command.updated_by_id) if command.updated_by_id else None
                if command.work_summary is not None:
                    maintenancereport.work_summary = command.work_summary
                
                maintenancereport.updatedAt = datetime.utcnow()
                repo.update(maintenancereport)
                uow.commit()
                
                return Result.success(maintenancereport)
                
        except Exception as e:
            return Result.failure(f"Failed to update maintenancereport: {str(e)}")
