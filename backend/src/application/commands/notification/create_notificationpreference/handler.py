from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationPreferenceRepository
from ....domain.entities.notification_entity import NotificationPreference
from .command import CreateNotificationPreferenceCommand

class CreateNotificationPreferenceHandler(RequestHandlerBase[CreateNotificationPreferenceCommand, Result[NotificationPreference]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateNotificationPreferenceCommand) -> Result[NotificationPreference]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationPreferenceRepository(uow.session)
                
                notificationpreference = NotificationPreference(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    category=command.category,
                    email_enabled=command.email_enabled,
                    in_app_enabled=command.in_app_enabled,
                    push_enabled=command.push_enabled,
                    user_id=uuid.UUID(command.user_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(notificationpreference)
                uow.commit()
                return Result.success(notificationpreference)
                
        except Exception as e:
            return Result.failure(f"Failed to create notificationpreference: {str(e)}")
