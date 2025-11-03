from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BenefitsRepository
from ....domain.entities.hrm_entity import Benefits
from .command import UpdateBenefitsCommand

class UpdateBenefitsHandler(RequestHandlerBase[UpdateBenefitsCommand, Result[Benefits]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateBenefitsCommand) -> Result[Benefits]:
        try:
            with self._unit_of_work as uow:
                repo = BenefitsRepository(uow.session)
                
                benefits = repo.get_by_id(command.benefits_id, command.tenant_id)
                if not benefits:
                    return Result.failure("Benefits not found")
                
                                if command.cost is not None:
                    benefits.cost = command.cost
                if command.description is not None:
                    benefits.description = command.description
                if command.employeeContribution is not None:
                    benefits.employeeContribution = command.employeeContribution
                if command.employerContribution is not None:
                    benefits.employerContribution = command.employerContribution
                if command.isActive is not None:
                    benefits.isActive = command.isActive
                if command.name is not None:
                    benefits.name = command.name
                if command.type is not None:
                    benefits.type = command.type
                
                benefits.updatedAt = datetime.utcnow()
                repo.update(benefits)
                uow.commit()
                
                return Result.success(benefits)
                
        except Exception as e:
            return Result.failure(f"Failed to update benefits: {str(e)}")
