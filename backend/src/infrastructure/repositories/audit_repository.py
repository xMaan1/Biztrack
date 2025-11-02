from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.audit_entity import AuditLog, Permission, CustomRole

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: Session):
        super().__init__(session, AuditLog)

    def get_by_user(self, user_id: str, tenant_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        query = self._session.query(AuditLog).filter(AuditLog.userId == user_id)
        if tenant_id:
            query = query.filter(AuditLog.tenant_id == tenant_id)
        return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, session: Session):
        super().__init__(session, Permission)

    def get_by_code(self, code: str) -> Optional[Permission]:
        return self._session.query(Permission).filter(Permission.code == code).first()

class CustomRoleRepository(BaseRepository[CustomRole]):
    def __init__(self, session: Session):
        super().__init__(session, CustomRole)

