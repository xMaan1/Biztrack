from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationRepository
from ....domain.entities.notification_entity import Notification
from .command import UpdateNotificationCommand

class UpdateNotificationHandler(RequestHandlerBase[UpdateNotificationCommand, Result[Notification]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateNotificationCommand) -> Result[Notification]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationRepository(uow.session)
                
                notification = repo.get_by_id(command.notification_id, command.tenant_id)
                if not notification:
                    return Result.failure("Notification not found")
                
                                if command.action_url is not None:
                    notification.action_url = command.action_url
                if command.category is not None:
                    notification.category = command.category
                if command.is_read is not None:
                    notification.is_read = command.is_read
                if command.message is not None:
                    notification.message = command.message
                if command.notification_data is not None:
                    notification.notification_data = command.notification_data or []
                if command.read_at is not None:
                    notification.read_at = datetime.fromisoformat(command.read_at.replace('Z', '+00:00')) if command.read_at else None
                if command.title is not None:
                    notification.title = command.title
                if command.type is not None:
                    notification.type = command.type
                if command.user_id is not None:
                    notification.user_id = uuid.UUID(command.user_id) if command.user_id else None
                
                notification.updatedAt = datetime.utcnow()
                repo.update(notification)
                uow.commit()
                
                return Result.success(notification)
                
        except Exception as e:
            return Result.failure(f"Failed to update notification: {str(e)}")
