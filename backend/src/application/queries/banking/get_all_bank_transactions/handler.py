from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankTransactionRepository
from ....domain.entities.banking_entity import BankTransaction
from ....domain.enums.banking_enums import TransactionType, TransactionStatus
from .query import GetAllBankTransactionsQuery

class GetAllBankTransactionsHandler(RequestHandlerBase[GetAllBankTransactionsQuery, Result[PagedResult[BankTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllBankTransactionsQuery) -> Result[PagedResult[BankTransaction]]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = BankTransactionRepository(uow.session)
                import uuid
                
                filters = [BankTransaction.tenant_id == uuid.UUID(query.tenant_id)]
                
                if query.account_id:
                    filters.append(BankTransaction.bank_account_id == uuid.UUID(query.account_id))
                
                if query.transaction_type:
                    transaction_type = TransactionType(query.transaction_type) if isinstance(query.transaction_type, str) else query.transaction_type
                    filters.append(BankTransaction.transaction_type == transaction_type)
                
                if query.status:
                    status = TransactionStatus(query.status) if isinstance(query.status, str) else query.status
                    filters.append(BankTransaction.status == status)
                
                if query.start_date:
                    filters.append(BankTransaction.transaction_date >= query.start_date)
                
                if query.end_date:
                    filters.append(BankTransaction.transaction_date <= query.end_date)
                
                base_query = transaction_repo._session.query(BankTransaction).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = BankTransaction.transaction_date
                if query.sort_by == "amount":
                    sort_column = BankTransaction.amount
                elif query.sort_by == "status":
                    sort_column = BankTransaction.status
                
                order_func = desc if query.sort_order == "desc" else asc
                transactions = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=transactions,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get bank transactions: {str(e)}")

