from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.invoice_entity import Invoice, Payment

class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, session: Session):
        super().__init__(session, Invoice)

    def get_by_invoice_number(self, invoice_number: str, tenant_id: Optional[str] = None) -> Optional[Invoice]:
        query = self._session.query(Invoice).filter(Invoice.invoiceNumber == invoice_number)
        if tenant_id:
            query = query.filter(Invoice.tenant_id == tenant_id)
        return query.first()

    def get_by_customer(self, customer_id: str, tenant_id: Optional[str] = None) -> List[Invoice]:
        query = self._session.query(Invoice).filter(Invoice.customerId == customer_id)
        if tenant_id:
            query = query.filter(Invoice.tenant_id == tenant_id)
        return query.all()

class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, session: Session):
        super().__init__(session, Payment)

    def get_by_invoice(self, invoice_id: str, tenant_id: Optional[str] = None) -> List[Payment]:
        query = self._session.query(Payment).filter(Payment.invoiceId == invoice_id)
        if tenant_id:
            query = query.filter(Payment.tenant_id == tenant_id)
        return query.all()

