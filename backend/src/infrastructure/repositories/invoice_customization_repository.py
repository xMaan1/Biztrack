from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.invoice_customization_entity import InvoiceCustomization

class InvoiceCustomizationRepository(BaseRepository[InvoiceCustomization]):
    def __init__(self, session: Session):
        super().__init__(session, InvoiceCustomization)

    def get_active_customization(self, tenant_id: str) -> Optional[InvoiceCustomization]:
        return self._session.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True
        ).first()

