from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationRepository
from .command import DeleteNotificationCommand

class DeleteNotificationHandler(RequestHandlerBase[DeleteNotificationCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteNotificationCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationRepository(uow.session)
                
                notification = repo.get_by_id(command.notification_id, command.tenant_id)
                if not notification:
                    return Result.failure("Notification not found")
                
                repo.delete(notification)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete notification: {str(e)}")
