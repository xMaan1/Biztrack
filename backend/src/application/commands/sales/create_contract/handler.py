from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContractRepository
from ....domain.entities.sales_entity import Contract
from .command import CreateContractCommand

class CreateContractHandler(RequestHandlerBase[CreateContractCommand, Result[Contract]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateContractCommand) -> Result[Contract]:
        try:
            with self._unit_of_work as uow:
                repo = ContractRepository(uow.session)
                
                contract = Contract(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    activatedAt=datetime.fromisoformat(command.activatedAt.replace('Z', '+00:00')) if command.activatedAt else None,
                    autoRenew=command.autoRenew,
                    contractNumber=command.contractNumber,
                    createdBy=uuid.UUID(command.createdBy),
                    description=command.description,
                    endDate=datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else datetime.utcnow(),
                    notes=command.notes,
                    opportunityId=command.opportunityId,
                    renewalTerms=command.renewalTerms,
                    signedAt=datetime.fromisoformat(command.signedAt.replace('Z', '+00:00')) if command.signedAt else None,
                    startDate=datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else datetime.utcnow(),
                    status=command.status,
                    terms=command.terms,
                    title=command.title,
                    value=command.value,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(contract)
                uow.commit()
                return Result.success(contract)
                
        except Exception as e:
            return Result.failure(f"Failed to create contract: {str(e)}")
