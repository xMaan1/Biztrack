from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContractRepository
from ....domain.entities.sales_entity import Contract
from .command import UpdateContractCommand

class UpdateContractHandler(RequestHandlerBase[UpdateContractCommand, Result[Contract]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateContractCommand) -> Result[Contract]:
        try:
            with self._unit_of_work as uow:
                repo = ContractRepository(uow.session)
                
                contract = repo.get_by_id(command.contract_id, command.tenant_id)
                if not contract:
                    return Result.failure("Contract not found")
                
                                if command.activatedAt is not None:
                    contract.activatedAt = datetime.fromisoformat(command.activatedAt.replace('Z', '+00:00')) if command.activatedAt else None
                if command.autoRenew is not None:
                    contract.autoRenew = command.autoRenew
                if command.contractNumber is not None:
                    contract.contractNumber = command.contractNumber
                if command.createdBy is not None:
                    contract.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.description is not None:
                    contract.description = command.description
                if command.endDate is not None:
                    contract.endDate = datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else None
                if command.notes is not None:
                    contract.notes = command.notes
                if command.opportunityId is not None:
                    contract.opportunityId = command.opportunityId
                if command.renewalTerms is not None:
                    contract.renewalTerms = command.renewalTerms
                if command.signedAt is not None:
                    contract.signedAt = datetime.fromisoformat(command.signedAt.replace('Z', '+00:00')) if command.signedAt else None
                if command.startDate is not None:
                    contract.startDate = datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else None
                if command.status is not None:
                    contract.status = command.status
                if command.terms is not None:
                    contract.terms = command.terms
                if command.title is not None:
                    contract.title = command.title
                if command.value is not None:
                    contract.value = command.value
                
                contract.updatedAt = datetime.utcnow()
                repo.update(contract)
                uow.commit()
                
                return Result.success(contract)
                
        except Exception as e:
            return Result.failure(f"Failed to update contract: {str(e)}")
