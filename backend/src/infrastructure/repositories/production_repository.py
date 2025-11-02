from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.production_entity import ProductionPlan, ProductionStep, ProductionSchedule

class ProductionPlanRepository(BaseRepository[ProductionPlan]):
    def __init__(self, session: Session):
        super().__init__(session, ProductionPlan)

    def get_by_plan_number(self, plan_number: str, tenant_id: Optional[str] = None) -> Optional[ProductionPlan]:
        query = self._session.query(ProductionPlan).filter(ProductionPlan.plan_number == plan_number)
        if tenant_id:
            query = query.filter(ProductionPlan.tenant_id == tenant_id)
        return query.first()

class ProductionStepRepository(BaseRepository[ProductionStep]):
    def __init__(self, session: Session):
        super().__init__(session, ProductionStep)

    def get_by_production_plan(self, production_plan_id: str) -> List[ProductionStep]:
        return self._session.query(ProductionStep).filter(
            ProductionStep.production_plan_id == production_plan_id
        ).all()

class ProductionScheduleRepository(BaseRepository[ProductionSchedule]):
    def __init__(self, session: Session):
        super().__init__(session, ProductionSchedule)

    def get_by_production_plan(self, production_plan_id: str, tenant_id: Optional[str] = None) -> List[ProductionSchedule]:
        query = self._session.query(ProductionSchedule).filter(
            ProductionSchedule.production_plan_id == production_plan_id
        )
        if tenant_id:
            query = query.filter(ProductionSchedule.tenant_id == tenant_id)
        return query.all()

