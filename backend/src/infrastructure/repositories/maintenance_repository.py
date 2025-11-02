from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.maintenance_entity import MaintenanceSchedule, MaintenanceWorkOrder, Equipment, MaintenanceReport

class MaintenanceScheduleRepository(BaseRepository[MaintenanceSchedule]):
    def __init__(self, session: Session):
        super().__init__(session, MaintenanceSchedule)

    def get_by_equipment(self, equipment_id: str, tenant_id: Optional[str] = None) -> List[MaintenanceSchedule]:
        query = self._session.query(MaintenanceSchedule).filter(MaintenanceSchedule.equipment_id == equipment_id)
        if tenant_id:
            query = query.filter(MaintenanceSchedule.tenant_id == tenant_id)
        return query.all()

class MaintenanceWorkOrderRepository(BaseRepository[MaintenanceWorkOrder]):
    def __init__(self, session: Session):
        super().__init__(session, MaintenanceWorkOrder)

    def get_by_schedule(self, schedule_id: str, tenant_id: Optional[str] = None) -> List[MaintenanceWorkOrder]:
        query = self._session.query(MaintenanceWorkOrder).filter(
            MaintenanceWorkOrder.maintenance_schedule_id == schedule_id
        )
        if tenant_id:
            query = query.filter(MaintenanceWorkOrder.tenant_id == tenant_id)
        return query.all()

class EquipmentRepository(BaseRepository[Equipment]):
    def __init__(self, session: Session):
        super().__init__(session, Equipment)

    def get_by_serial_number(self, serial_number: str, tenant_id: Optional[str] = None) -> Optional[Equipment]:
        query = self._session.query(Equipment).filter(Equipment.serial_number == serial_number)
        if tenant_id:
            query = query.filter(Equipment.tenant_id == tenant_id)
        return query.first()

class MaintenanceReportRepository(BaseRepository[MaintenanceReport]):
    def __init__(self, session: Session):
        super().__init__(session, MaintenanceReport)

    def get_by_work_order(self, work_order_id: str, tenant_id: Optional[str] = None) -> List[MaintenanceReport]:
        query = self._session.query(MaintenanceReport).filter(
            MaintenanceReport.maintenance_work_order_id == work_order_id
        )
        if tenant_id:
            query = query.filter(MaintenanceReport.tenant_id == tenant_id)
        return query.all()

