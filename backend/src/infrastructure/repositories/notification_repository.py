from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.notification_entity import Notification, NotificationPreference

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: Session):
        super().__init__(session, Notification)

    def get_by_user(self, user_id: str, tenant_id: Optional[str] = None, unread_only: bool = False) -> List[Notification]:
        query = self._session.query(Notification).filter(Notification.user_id == user_id)
        if tenant_id:
            query = query.filter(Notification.tenant_id == tenant_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.created_at.desc()).all()

class NotificationPreferenceRepository(BaseRepository[NotificationPreference]):
    def __init__(self, session: Session):
        super().__init__(session, NotificationPreference)

    def get_by_user(self, user_id: str, tenant_id: Optional[str] = None) -> List[NotificationPreference]:
        query = self._session.query(NotificationPreference).filter(NotificationPreference.user_id == user_id)
        if tenant_id:
            query = query.filter(NotificationPreference.tenant_id == tenant_id)
        return query.all()

