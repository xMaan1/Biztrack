from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillRepository
from ....domain.entities.banking_entity import Till
from .command import UpdateTillCommand

class UpdateTillHandler(RequestHandlerBase[UpdateTillCommand, Result[Till]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTillCommand) -> Result[Till]:
        try:
            with self._unit_of_work as uow:
                till_repo = TillRepository(uow.session)
                
                till = till_repo.get_by_id(command.till_id, command.tenant_id)
                if not till:
                    return Result.failure("Till not found")
                
                if command.name is not None:
                    till.name = command.name
                if command.location is not None:
                    till.location = command.location
                if command.initial_balance is not None:
                    till.initial_balance = command.initial_balance
                if command.is_active is not None:
                    till.is_active = command.is_active
                if command.description is not None:
                    till.description = command.description
                
                till.updated_at = datetime.utcnow()
                till_repo.update(till)
                uow.commit()
                
                return Result.success(till)
                
        except Exception as e:
            return Result.failure(f"Failed to update till: {str(e)}")

