from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationPreferenceRepository
from ....domain.entities.notification_entity import NotificationPreference
from .command import UpdateNotificationPreferenceCommand

class UpdateNotificationPreferenceHandler(RequestHandlerBase[UpdateNotificationPreferenceCommand, Result[NotificationPreference]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateNotificationPreferenceCommand) -> Result[NotificationPreference]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationPreferenceRepository(uow.session)
                
                notificationpreference = repo.get_by_id(command.notificationpreference_id, command.tenant_id)
                if not notificationpreference:
                    return Result.failure("NotificationPreference not found")
                
                                if command.category is not None:
                    notificationpreference.category = command.category
                if command.email_enabled is not None:
                    notificationpreference.email_enabled = command.email_enabled
                if command.in_app_enabled is not None:
                    notificationpreference.in_app_enabled = command.in_app_enabled
                if command.push_enabled is not None:
                    notificationpreference.push_enabled = command.push_enabled
                if command.user_id is not None:
                    notificationpreference.user_id = uuid.UUID(command.user_id) if command.user_id else None
                
                notificationpreference.updatedAt = datetime.utcnow()
                repo.update(notificationpreference)
                uow.commit()
                
                return Result.success(notificationpreference)
                
        except Exception as e:
            return Result.failure(f"Failed to update notificationpreference: {str(e)}")
