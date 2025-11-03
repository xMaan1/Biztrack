from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillRepository
from ....domain.entities.banking_entity import Till
from .command import CreateTillCommand

class CreateTillHandler(RequestHandlerBase[CreateTillCommand, Result[Till]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTillCommand) -> Result[Till]:
        try:
            with self._unit_of_work as uow:
                till_repo = TillRepository(uow.session)
                
                till_entity = Till(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    name=command.name,
                    location=command.location,
                    initial_balance=command.initial_balance,
                    current_balance=command.current_balance,
                    currency=command.currency,
                    is_active=command.is_active,
                    description=command.description,
                    created_by=uuid.UUID(command.created_by) if command.created_by else None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                till_repo.add(till_entity)
                uow.commit()
                return Result.success(till_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create till: {str(e)}")

