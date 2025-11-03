from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import NotificationPreferenceRepository
from .command import DeleteNotificationPreferenceCommand

class DeleteNotificationPreferenceHandler(RequestHandlerBase[DeleteNotificationPreferenceCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteNotificationPreferenceCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = NotificationPreferenceRepository(uow.session)
                
                notificationpreference = repo.get_by_id(command.notificationpreference_id, command.tenant_id)
                if not notificationpreference:
                    return Result.failure("NotificationPreference not found")
                
                repo.delete(notificationpreference)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete notificationpreference: {str(e)}")
