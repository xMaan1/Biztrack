from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationRepository
from ....domain.entities.notification_entity import Notification
from .query import GetNotificationByIdQuery

class GetNotificationByIdHandler(RequestHandlerBase[GetNotificationByIdQuery, Result[Optional[Notification]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetNotificationByIdQuery) -> Result[Optional[Notification]]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationRepository(uow.session)
                entity = repo.get_by_id(query.notification_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get notification: {str(e)}")
