from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationRepository
from ....domain.entities.notification_entity import Notification
from .command import CreateNotificationCommand

class CreateNotificationHandler(RequestHandlerBase[CreateNotificationCommand, Result[Notification]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateNotificationCommand) -> Result[Notification]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationRepository(uow.session)
                
                notification = Notification(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    action_url=command.action_url,
                    category=command.category,
                    is_read=command.is_read,
                    message=command.message,
                    notification_data=command.notification_data or [],
                    read_at=datetime.fromisoformat(command.read_at.replace('Z', '+00:00')) if command.read_at else None,
                    title=command.title,
                    type=command.type,
                    user_id=uuid.UUID(command.user_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(notification)
                uow.commit()
                return Result.success(notification)
                
        except Exception as e:
            return Result.failure(f"Failed to create notification: {str(e)}")
