from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankTransactionRepository
from ....domain.entities.banking_entity import BankTransaction
from ....domain.enums.banking_enums import TransactionType, TransactionStatus, PaymentMethod
from .command import UpdateBankTransactionCommand
import uuid

class UpdateBankTransactionHandler(RequestHandlerBase[UpdateBankTransactionCommand, Result[BankTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateBankTransactionCommand) -> Result[BankTransaction]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = BankTransactionRepository(uow.session)
                
                transaction = transaction_repo.get_by_id(command.transaction_id, command.tenant_id)
                if not transaction:
                    return Result.failure("Bank transaction not found")
                
                if command.bank_account_id is not None:
                    transaction.bank_account_id = uuid.UUID(command.bank_account_id)
                if command.transaction_date is not None:
                    transaction.transaction_date = command.transaction_date
                if command.value_date is not None:
                    transaction.value_date = command.value_date
                if command.transaction_type is not None:
                    transaction.transaction_type = TransactionType(command.transaction_type) if isinstance(command.transaction_type, str) else command.transaction_type
                if command.status is not None:
                    transaction.status = TransactionStatus(command.status) if isinstance(command.status, str) else command.status
                if command.amount is not None:
                    transaction.amount = command.amount
                if command.running_balance is not None:
                    transaction.running_balance = command.running_balance
                if command.currency is not None:
                    transaction.currency = command.currency
                if command.exchange_rate is not None:
                    transaction.exchange_rate = command.exchange_rate
                if command.base_amount is not None:
                    transaction.base_amount = command.base_amount
                if command.payment_method is not None:
                    transaction.payment_method = PaymentMethod(command.payment_method) if command.payment_method else None
                if command.reference_number is not None:
                    transaction.reference_number = command.reference_number
                if command.external_reference is not None:
                    transaction.external_reference = command.external_reference
                if command.check_number is not None:
                    transaction.check_number = command.check_number
                if command.description is not None:
                    transaction.description = command.description
                if command.memo is not None:
                    transaction.memo = command.memo
                if command.category is not None:
                    transaction.category = command.category
                if command.counterparty_name is not None:
                    transaction.counterparty_name = command.counterparty_name
                if command.counterparty_account is not None:
                    transaction.counterparty_account = command.counterparty_account
                if command.counterparty_bank is not None:
                    transaction.counterparty_bank = command.counterparty_bank
                if command.related_invoice_id is not None:
                    transaction.related_invoice_id = uuid.UUID(command.related_invoice_id) if command.related_invoice_id else None
                if command.related_purchase_order_id is not None:
                    transaction.related_purchase_order_id = uuid.UUID(command.related_purchase_order_id) if command.related_purchase_order_id else None
                if command.related_expense_id is not None:
                    transaction.related_expense_id = uuid.UUID(command.related_expense_id) if command.related_expense_id else None
                if command.ledger_transaction_id is not None:
                    transaction.ledger_transaction_id = uuid.UUID(command.ledger_transaction_id) if command.ledger_transaction_id else None
                if command.tags is not None:
                    transaction.tags = command.tags
                if command.attachments is not None:
                    transaction.attachments = command.attachments
                if command.notes is not None:
                    transaction.notes = command.notes
                if command.approved_by is not None:
                    transaction.approved_by = uuid.UUID(command.approved_by) if command.approved_by else None
                if command.is_reconciled is not None:
                    transaction.is_reconciled = command.is_reconciled
                    if command.is_reconciled and not transaction.reconciled_date:
                        transaction.reconciled_date = datetime.utcnow()
                if command.reconciled_by is not None:
                    transaction.reconciled_by = uuid.UUID(command.reconciled_by) if command.reconciled_by else None
                
                transaction.updated_at = datetime.utcnow()
                transaction_repo.update(transaction)
                uow.commit()
                
                return Result.success(transaction)
                
        except Exception as e:
            return Result.failure(f"Failed to update bank transaction: {str(e)}")

