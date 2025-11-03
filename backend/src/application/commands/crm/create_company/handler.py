from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CompanyRepository
from ....domain.entities.crm_entity import Company
from .command import CreateCompanyCommand

class CreateCompanyHandler(RequestHandlerBase[CreateCompanyCommand, Result[Company]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateCompanyCommand) -> Result[Company]:
        try:
            with self._unit_of_work as uow:
                repo = CompanyRepository(uow.session)
                
                company = Company(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    address=command.address,
                    annualRevenue=command.annualRevenue,
                    city=command.city,
                    country=command.country,
                    employeeCount=command.employeeCount,
                    industry=command.industry,
                    isActive=command.isActive,
                    name=command.name,
                    notes=command.notes,
                    phone=command.phone,
                    postalCode=command.postalCode,
                    state=command.state,
                    website=command.website,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(company)
                uow.commit()
                return Result.success(company)
                
        except Exception as e:
            return Result.failure(f"Failed to create company: {str(e)}")
