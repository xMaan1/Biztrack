from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BenefitsRepository
from ....domain.entities.hrm_entity import Benefits
from .command import CreateBenefitsCommand

class CreateBenefitsHandler(RequestHandlerBase[CreateBenefitsCommand, Result[Benefits]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateBenefitsCommand) -> Result[Benefits]:
        try:
            with self._unit_of_work as uow:
                repo = BenefitsRepository(uow.session)
                
                benefits = Benefits(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    cost=command.cost,
                    description=command.description,
                    employeeContribution=command.employeeContribution,
                    employerContribution=command.employerContribution,
                    isActive=command.isActive,
                    name=command.name,
                    type=command.type,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(benefits)
                uow.commit()
                return Result.success(benefits)
                
        except Exception as e:
            return Result.failure(f"Failed to create benefits: {str(e)}")
