from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QuoteRepository
from ....domain.entities.sales_entity import Quote
from .command import CreateQuoteCommand

class CreateQuoteHandler(RequestHandlerBase[CreateQuoteCommand, Result[Quote]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateQuoteCommand) -> Result[Quote]:
        try:
            with self._unit_of_work as uow:
                repo = QuoteRepository(uow.session)
                
                quote = Quote(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    acceptedAt=datetime.fromisoformat(command.acceptedAt.replace('Z', '+00:00')) if command.acceptedAt else None,
                    createdBy=uuid.UUID(command.createdBy),
                    description=command.description,
                    notes=command.notes,
                    opportunityId=command.opportunityId,
                    quoteNumber=command.quoteNumber,
                    sentAt=datetime.fromisoformat(command.sentAt.replace('Z', '+00:00')) if command.sentAt else None,
                    status=command.status,
                    subtotal=command.subtotal,
                    taxAmount=command.taxAmount,
                    taxRate=command.taxRate,
                    terms=command.terms,
                    title=command.title,
                    total=command.total,
                    validUntil=datetime.fromisoformat(command.validUntil.replace('Z', '+00:00')) if command.validUntil else datetime.utcnow(),
                    viewedAt=datetime.fromisoformat(command.viewedAt.replace('Z', '+00:00')) if command.viewedAt else None,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(quote)
                uow.commit()
                return Result.success(quote)
                
        except Exception as e:
            return Result.failure(f"Failed to create quote: {str(e)}")
