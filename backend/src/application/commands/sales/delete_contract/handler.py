from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContractRepository
from .command import DeleteContractCommand

class DeleteContractHandler(RequestHandlerBase[DeleteContractCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteContractCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ContractRepository(uow.session)
                
                contract = repo.get_by_id(command.contract_id, command.tenant_id)
                if not contract:
                    return Result.failure("Contract not found")
                
                repo.delete(contract)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete contract: {str(e)}")
