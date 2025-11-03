from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QuoteRepository
from .command import DeleteQuoteCommand

class DeleteQuoteHandler(RequestHandlerBase[DeleteQuoteCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteQuoteCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = QuoteRepository(uow.session)
                
                quote = repo.get_by_id(command.quote_id, command.tenant_id)
                if not quote:
                    return Result.failure("Quote not found")
                
                repo.delete(quote)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete quote: {str(e)}")
