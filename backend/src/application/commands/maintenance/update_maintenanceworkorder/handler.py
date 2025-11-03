from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceWorkOrderRepository
from ....domain.entities.maintenance_entity import MaintenanceWorkOrder
from .command import UpdateMaintenanceWorkOrderCommand

class UpdateMaintenanceWorkOrderHandler(RequestHandlerBase[UpdateMaintenanceWorkOrderCommand, Result[MaintenanceWorkOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateMaintenanceWorkOrderCommand) -> Result[MaintenanceWorkOrder]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceWorkOrderRepository(uow.session)
                
                maintenanceworkorder = repo.get_by_id(command.maintenanceworkorder_id, command.tenant_id)
                if not maintenanceworkorder:
                    return Result.failure("MaintenanceWorkOrder not found")
                
                                if command.actual_duration_hours is not None:
                    maintenanceworkorder.actual_duration_hours = command.actual_duration_hours
                if command.approval_required is not None:
                    maintenanceworkorder.approval_required = command.approval_required
                if command.approved_by_id is not None:
                    maintenanceworkorder.approved_by_id = uuid.UUID(command.approved_by_id) if command.approved_by_id else None
                if command.created_by_id is not None:
                    maintenanceworkorder.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.documents is not None:
                    maintenanceworkorder.documents = command.documents or []
                if command.end_time is not None:
                    maintenanceworkorder.end_time = datetime.fromisoformat(command.end_time.replace('Z', '+00:00')) if command.end_time else None
                if command.issues_encountered is not None:
                    maintenanceworkorder.issues_encountered = command.issues_encountered or []
                if command.maintenance_schedule_id is not None:
                    maintenanceworkorder.maintenance_schedule_id = uuid.UUID(command.maintenance_schedule_id) if command.maintenance_schedule_id else None
                if command.notes is not None:
                    maintenanceworkorder.notes = command.notes
                if command.parts_used is not None:
                    maintenanceworkorder.parts_used = command.parts_used or []
                if command.photos is not None:
                    maintenanceworkorder.photos = command.photos or []
                if command.quality_checks is not None:
                    maintenanceworkorder.quality_checks = command.quality_checks or []
                if command.solutions_applied is not None:
                    maintenanceworkorder.solutions_applied = command.solutions_applied or []
                if command.start_time is not None:
                    maintenanceworkorder.start_time = datetime.fromisoformat(command.start_time.replace('Z', '+00:00')) if command.start_time else None
                if command.status is not None:
                    maintenanceworkorder.status = command.status
                if command.technician_id is not None:
                    maintenanceworkorder.technician_id = uuid.UUID(command.technician_id) if command.technician_id else None
                if command.tools_used is not None:
                    maintenanceworkorder.tools_used = command.tools_used or []
                if command.updated_by_id is not None:
                    maintenanceworkorder.updated_by_id = uuid.UUID(command.updated_by_id) if command.updated_by_id else None
                if command.work_performed is not None:
                    maintenanceworkorder.work_performed = command.work_performed or []
                
                maintenanceworkorder.updatedAt = datetime.utcnow()
                repo.update(maintenanceworkorder)
                uow.commit()
                
                return Result.success(maintenanceworkorder)
                
        except Exception as e:
            return Result.failure(f"Failed to update maintenanceworkorder: {str(e)}")
