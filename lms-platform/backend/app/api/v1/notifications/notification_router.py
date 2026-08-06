from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.exceptions import NotFoundError
from ....schemas.notification import NotificationResponse
from ....schemas.common import ResponseWrapper
from ....services.notification_service import NotificationService

router = APIRouter()


def _serialize_notification(n):
    return {
        "id": n.id,
        "user_id": n.user_id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "link": n.link,
        "created_at": str(n.created_at) if n.created_at else None,
    }


@router.get("/", response_model=ResponseWrapper)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    notifications, total = NotificationService.get_user_notifications(db, user_id, skip=skip, limit=limit, unread_only=unread_only)
    return ResponseWrapper(
        success=True,
        message="Notifications retrieved",
        data={
            "notifications": [_serialize_notification(n) for n in notifications],
            "total": total,
            "unread_count": sum(1 for n in notifications if not n.is_read) if not unread_only else total,
        }
    )


@router.put("/{notification_id}/read", response_model=ResponseWrapper)
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    try:
        notification = NotificationService.mark_as_read(db, notification_id, current_user["user_id"])
        return ResponseWrapper(
            success=True,
            message="Notification marked as read",
            data=_serialize_notification(notification)
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})


@router.put("/read-all", response_model=ResponseWrapper)
async def mark_all_notifications_read(
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    count = NotificationService.mark_all_as_read(db, current_user["user_id"])
    return ResponseWrapper(
        success=True,
        message=f"{count} notifications marked as read",
        data={"marked_count": count}
    )


@router.delete("/{notification_id}", response_model=ResponseWrapper)
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    try:
        NotificationService.delete_notification(db, notification_id, current_user["user_id"])
        return ResponseWrapper(success=True, message="Notification deleted")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": str(e)}})


@router.delete("/clear-all", response_model=ResponseWrapper)
async def clear_all_notifications(
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
):
    count = NotificationService.clear_all_notifications(db, current_user["user_id"])
    return ResponseWrapper(
        success=True,
        message=f"{count} notifications cleared",
        data={"deleted_count": count}
    )
