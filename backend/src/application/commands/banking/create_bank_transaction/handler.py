from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankTransactionRepository
from ....domain.entities.banking_entity import BankTransaction
from ....domain.enums.banking_enums import TransactionType, TransactionStatus, PaymentMethod
from .command import CreateBankTransactionCommand

class CreateBankTransactionHandler(RequestHandlerBase[CreateBankTransactionCommand, Result[BankTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateBankTransactionCommand) -> Result[BankTransaction]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = BankTransactionRepository(uow.session)
                
                transaction_type = TransactionType(command.transaction_type) if isinstance(command.transaction_type, str) else command.transaction_type
                status = TransactionStatus(command.status) if isinstance(command.status, str) else command.status
                payment_method = PaymentMethod(command.payment_method) if command.payment_method and isinstance(command.payment_method, str) else None
                
                transaction_entity = BankTransaction(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    bank_account_id=uuid.UUID(command.bank_account_id),
                    transaction_number=command.transaction_number,
                    transaction_date=command.transaction_date,
                    value_date=command.value_date,
                    transaction_type=transaction_type,
                    status=status,
                    amount=command.amount,
                    running_balance=command.running_balance,
                    currency=command.currency,
                    exchange_rate=command.exchange_rate,
                    base_amount=command.base_amount,
                    payment_method=payment_method,
                    reference_number=command.reference_number,
                    external_reference=command.external_reference,
                    check_number=command.check_number,
                    description=command.description,
                    memo=command.memo,
                    category=command.category,
                    counterparty_name=command.counterparty_name,
                    counterparty_account=command.counterparty_account,
                    counterparty_bank=command.counterparty_bank,
                    related_invoice_id=uuid.UUID(command.related_invoice_id) if command.related_invoice_id else None,
                    related_purchase_order_id=uuid.UUID(command.related_purchase_order_id) if command.related_purchase_order_id else None,
                    related_expense_id=uuid.UUID(command.related_expense_id) if command.related_expense_id else None,
                    ledger_transaction_id=uuid.UUID(command.ledger_transaction_id) if command.ledger_transaction_id else None,
                    tags=command.tags or [],
                    attachments=command.attachments or [],
                    notes=command.notes,
                    created_by=uuid.UUID(command.created_by) if command.created_by else None,
                    approved_by=uuid.UUID(command.approved_by) if command.approved_by else None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                transaction_repo.add(transaction_entity)
                uow.commit()
                return Result.success(transaction_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create bank transaction: {str(e)}")

