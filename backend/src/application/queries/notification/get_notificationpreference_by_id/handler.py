from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationPreferenceRepository
from ....domain.entities.notification_entity import NotificationPreference
from .query import GetNotificationPreferenceByIdQuery

class GetNotificationPreferenceByIdHandler(RequestHandlerBase[GetNotificationPreferenceByIdQuery, Result[Optional[NotificationPreference]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetNotificationPreferenceByIdQuery) -> Result[Optional[NotificationPreference]]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationPreferenceRepository(uow.session)
                entity = repo.get_by_id(query.notificationpreference_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get notificationpreference: {str(e)}")
