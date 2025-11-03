from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ...infrastructure.repository import BaseRepository
from ...domain.entities.crm_entity import Lead, Contact, Company, Opportunity, SalesActivity, Customer

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: Session):
        super().__init__(session, Customer)

    def get_by_cnic(self, cnic: str, tenant_id: str) -> Optional[Customer]:
        return self._session.query(Customer).filter(
            and_(
                Customer.cnic == cnic,
                Customer.tenant_id == tenant_id
            )
        ).first()

    def get_by_email(self, email: str, tenant_id: str) -> Optional[Customer]:
        return self._session.query(Customer).filter(
            and_(
                Customer.email == email,
                Customer.tenant_id == tenant_id
            )
        ).first()

    def get_by_customer_id(self, customer_id: str, tenant_id: str) -> Optional[Customer]:
        return self._session.query(Customer).filter(
            and_(
                Customer.customerId == customer_id,
                Customer.tenant_id == tenant_id
            )
        ).first()

class LeadRepository(BaseRepository[Lead]):
    def __init__(self, session: Session):
        super().__init__(session, Lead)

class ContactRepository(BaseRepository[Contact]):
    def __init__(self, session: Session):
        super().__init__(session, Contact)

    def get_by_company(self, company_id: str, tenant_id: Optional[str] = None) -> List[Contact]:
        query = self._session.query(Contact).filter(Contact.companyId == company_id)
        if tenant_id:
            query = query.filter(Contact.tenant_id == tenant_id)
        return query.all()

class CompanyRepository(BaseRepository[Company]):
    def __init__(self, session: Session):
        super().__init__(session, Company)

class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, session: Session):
        super().__init__(session, Opportunity)

    def get_by_company(self, company_id: str, tenant_id: Optional[str] = None) -> List[Opportunity]:
        query = self._session.query(Opportunity).filter(Opportunity.companyId == company_id)
        if tenant_id:
            query = query.filter(Opportunity.tenant_id == tenant_id)
        return query.all()

class SalesActivityRepository(BaseRepository[SalesActivity]):
    def __init__(self, session: Session):
        super().__init__(session, SalesActivity)

