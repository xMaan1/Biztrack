from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceReportRepository
from ....domain.entities.maintenance_entity import MaintenanceReport
from .command import CreateMaintenanceReportCommand

class CreateMaintenanceReportHandler(RequestHandlerBase[CreateMaintenanceReportCommand, Result[MaintenanceReport]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateMaintenanceReportCommand) -> Result[MaintenanceReport]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceReportRepository(uow.session)
                
                maintenancereport = MaintenanceReport(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    approval_status=command.approval_status,
                    approved_by_id=uuid.UUID(command.approved_by_id),
                    compliance_notes=command.compliance_notes or [],
                    cost_breakdown=command.cost_breakdown or [],
                    created_by_id=uuid.UUID(command.created_by_id),
                    description=command.description,
                    documents=command.documents or [],
                    efficiency_improvement=command.efficiency_improvement,
                    equipment_id=uuid.UUID(command.equipment_id),
                    issues_found=command.issues_found or [],
                    maintenance_type=command.maintenance_type,
                    maintenance_work_order_id=uuid.UUID(command.maintenance_work_order_id),
                    next_maintenance_date=datetime.fromisoformat(command.next_maintenance_date.replace('Z', '+00:00')) if command.next_maintenance_date else datetime.utcnow(),
                    parts_replaced=command.parts_replaced or [],
                    photos=command.photos or [],
                    recommendations=command.recommendations or [],
                    report_date=datetime.fromisoformat(command.report_date.replace('Z', '+00:00')) if command.report_date else datetime.utcnow(),
                    safety_improvements=command.safety_improvements or [],
                    technician_id=uuid.UUID(command.technician_id),
                    title=command.title,
                    tools_used=command.tools_used or [],
                    total_cost=command.total_cost,
                    updated_by_id=uuid.UUID(command.updated_by_id),
                    work_summary=command.work_summary,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(maintenancereport)
                uow.commit()
                return Result.success(maintenancereport)
                
        except Exception as e:
            return Result.failure(f"Failed to create maintenancereport: {str(e)}")
