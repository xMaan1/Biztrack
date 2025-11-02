from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillRepository
from .command import DeleteTillCommand

class DeleteTillHandler(RequestHandlerBase[DeleteTillCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTillCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                till_repo = TillRepository(uow.session)
                
                till = till_repo.get_by_id(command.till_id, command.tenant_id)
                if not till:
                    return Result.failure("Till not found")
                
                till.is_active = False
                till.updated_at = datetime.utcnow()
                till_repo.update(till)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete till: {str(e)}")

