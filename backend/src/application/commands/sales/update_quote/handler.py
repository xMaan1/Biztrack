from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QuoteRepository
from ....domain.entities.sales_entity import Quote
from .command import UpdateQuoteCommand

class UpdateQuoteHandler(RequestHandlerBase[UpdateQuoteCommand, Result[Quote]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateQuoteCommand) -> Result[Quote]:
        try:
            with self._unit_of_work as uow:
                repo = QuoteRepository(uow.session)
                
                quote = repo.get_by_id(command.quote_id, command.tenant_id)
                if not quote:
                    return Result.failure("Quote not found")
                
                                if command.acceptedAt is not None:
                    quote.acceptedAt = datetime.fromisoformat(command.acceptedAt.replace('Z', '+00:00')) if command.acceptedAt else None
                if command.createdBy is not None:
                    quote.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.description is not None:
                    quote.description = command.description
                if command.notes is not None:
                    quote.notes = command.notes
                if command.opportunityId is not None:
                    quote.opportunityId = command.opportunityId
                if command.quoteNumber is not None:
                    quote.quoteNumber = command.quoteNumber
                if command.sentAt is not None:
                    quote.sentAt = datetime.fromisoformat(command.sentAt.replace('Z', '+00:00')) if command.sentAt else None
                if command.status is not None:
                    quote.status = command.status
                if command.subtotal is not None:
                    quote.subtotal = command.subtotal
                if command.taxAmount is not None:
                    quote.taxAmount = command.taxAmount
                if command.taxRate is not None:
                    quote.taxRate = command.taxRate
                if command.terms is not None:
                    quote.terms = command.terms
                if command.title is not None:
                    quote.title = command.title
                if command.total is not None:
                    quote.total = command.total
                if command.validUntil is not None:
                    quote.validUntil = datetime.fromisoformat(command.validUntil.replace('Z', '+00:00')) if command.validUntil else None
                if command.viewedAt is not None:
                    quote.viewedAt = datetime.fromisoformat(command.viewedAt.replace('Z', '+00:00')) if command.viewedAt else None
                
                quote.updatedAt = datetime.utcnow()
                repo.update(quote)
                uow.commit()
                
                return Result.success(quote)
                
        except Exception as e:
            return Result.failure(f"Failed to update quote: {str(e)}")
