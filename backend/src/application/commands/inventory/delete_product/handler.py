from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductRepository
from .command import DeleteProductCommand

class DeleteProductHandler(RequestHandlerBase[DeleteProductCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteProductCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                product_repo = ProductRepository(uow.session)
                
                success = product_repo.delete(command.product_id, command.tenant_id)
                if not success:
                    return Result.failure("Product not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete product: {str(e)}")

