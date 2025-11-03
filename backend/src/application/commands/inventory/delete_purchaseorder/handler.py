from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PurchaseOrderRepository
from .command import DeletePurchaseOrderCommand

class DeletePurchaseOrderHandler(RequestHandlerBase[DeletePurchaseOrderCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeletePurchaseOrderCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = PurchaseOrderRepository(uow.session)
                
                purchaseorder = repo.get_by_id(command.purchaseorder_id, command.tenant_id)
                if not purchaseorder:
                    return Result.failure("PurchaseOrder not found")
                
                repo.delete(purchaseorder)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete purchaseorder: {str(e)}")
