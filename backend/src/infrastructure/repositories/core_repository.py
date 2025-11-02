from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.core_entity import User, Tenant, Plan, Subscription, TenantUser
import uuid

class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(session, User)

    def get_by_email(self, email: str) -> Optional[User]:
        return self._session.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self._session.query(User).filter(User.userName == username).first()

class TenantRepository(BaseRepository[Tenant]):
    def __init__(self, session: Session):
        super().__init__(session, Tenant)

    def get_by_domain(self, domain: str) -> Optional[Tenant]:
        return self._session.query(Tenant).filter(Tenant.domain == domain).first()

class PlanRepository(BaseRepository[Plan]):
    def __init__(self, session: Session):
        super().__init__(session, Plan)

    def get_active_plans(self, skip: int = 0, limit: int = 100) -> List[Plan]:
        return self._session.query(Plan).filter(
            Plan.isActive == True
        ).offset(skip).limit(limit).all()

class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, session: Session):
        super().__init__(session, Subscription)

    def get_tenant_subscription(self, tenant_id: str) -> Optional[Subscription]:
        return self._session.query(Subscription).filter(
            Subscription.tenant_id == tenant_id,
            Subscription.status.in_(["active", "trial"])
        ).first()

class TenantUserRepository(BaseRepository[TenantUser]):
    def __init__(self, session: Session):
        super().__init__(session, TenantUser)

    def get_tenant_user(self, tenant_id: str, user_id: str) -> Optional[TenantUser]:
        return self._session.query(TenantUser).filter(
            TenantUser.tenant_id == tenant_id,
            TenantUser.userId == user_id
        ).first()

    def get_tenant_users(self, tenant_id: str, skip: int = 0, limit: int = 100) -> List[TenantUser]:
        return self._session.query(TenantUser).filter(
            TenantUser.tenant_id == tenant_id,
            TenantUser.isActive == True
        ).offset(skip).limit(limit).all()

    def get_user_tenants(self, user_id: str) -> List[TenantUser]:
        return self._session.query(TenantUser).filter(
            TenantUser.userId == user_id,
            TenantUser.isActive == True
        ).all()

