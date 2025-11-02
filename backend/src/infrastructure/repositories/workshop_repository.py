from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.workshop_entity import WorkOrder, WorkOrderTask

class WorkOrderRepository(BaseRepository[WorkOrder]):
    def __init__(self, session: Session):
        super().__init__(session, WorkOrder)

    def get_by_work_order_number(self, work_order_number: str, tenant_id: Optional[str] = None) -> Optional[WorkOrder]:
        query = self._session.query(WorkOrder).filter(WorkOrder.work_order_number == work_order_number)
        if tenant_id:
            query = query.filter(WorkOrder.tenant_id == tenant_id)
        return query.first()

class WorkOrderTaskRepository(BaseRepository[WorkOrderTask]):
    def __init__(self, session: Session):
        super().__init__(session, WorkOrderTask)

    def get_by_work_order(self, work_order_id: str, tenant_id: Optional[str] = None) -> List[WorkOrderTask]:
        query = self._session.query(WorkOrderTask).filter(WorkOrderTask.work_order_id == work_order_id)
        if tenant_id:
            query = query.filter(WorkOrderTask.tenant_id == tenant_id)
        return query.all()

