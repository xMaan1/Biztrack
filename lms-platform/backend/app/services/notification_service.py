import asyncio
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.notification import Notification
from ..core.exceptions import NotFoundError
from .websocket_manager import ws_manager

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> tuple[List[Notification], int]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        return notifications, total

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if not notification:
            raise NotFoundError("Notification not found", resource_type="Notification", resource_id=notification_id)
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return count

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str = "info",
        link: Optional[str] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        notification_data = {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "link": notification.link,
            "created_at": str(notification.created_at) if notification.created_at else None,
        }

        try:
            asyncio.ensure_future(ws_manager.send_notification(user_id, notification_data))
        except Exception as e:
            logger.error(f"Failed to send live notification: {e}")

        return notification

    @staticmethod
    def clear_all_notifications(db: Session, user_id: int) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id
        ).count()
        db.query(Notification).filter(
            Notification.user_id == user_id
        ).delete()
        db.commit()
        return count

    @staticmethod
    def delete_notification(db: Session, notification_id: int, user_id: int) -> None:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if not notification:
            raise NotFoundError("Notification not found", resource_type="Notification", resource_id=notification_id)
        db.delete(notification)
        db.commit()
