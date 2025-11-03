from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CompanyRepository
from ....domain.entities.crm_entity import Company
from .command import UpdateCompanyCommand

class UpdateCompanyHandler(RequestHandlerBase[UpdateCompanyCommand, Result[Company]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateCompanyCommand) -> Result[Company]:
        try:
            with self._unit_of_work as uow:
                repo = CompanyRepository(uow.session)
                
                company = repo.get_by_id(command.company_id, command.tenant_id)
                if not company:
                    return Result.failure("Company not found")
                
                                if command.address is not None:
                    company.address = command.address
                if command.annualRevenue is not None:
                    company.annualRevenue = command.annualRevenue
                if command.city is not None:
                    company.city = command.city
                if command.country is not None:
                    company.country = command.country
                if command.employeeCount is not None:
                    company.employeeCount = command.employeeCount
                if command.industry is not None:
                    company.industry = command.industry
                if command.isActive is not None:
                    company.isActive = command.isActive
                if command.name is not None:
                    company.name = command.name
                if command.notes is not None:
                    company.notes = command.notes
                if command.phone is not None:
                    company.phone = command.phone
                if command.postalCode is not None:
                    company.postalCode = command.postalCode
                if command.state is not None:
                    company.state = command.state
                if command.website is not None:
                    company.website = command.website
                
                company.updatedAt = datetime.utcnow()
                repo.update(company)
                uow.commit()
                
                return Result.success(company)
                
        except Exception as e:
            return Result.failure(f"Failed to update company: {str(e)}")
