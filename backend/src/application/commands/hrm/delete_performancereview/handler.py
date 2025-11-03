from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PerformanceReviewRepository
from .command import DeletePerformanceReviewCommand

class DeletePerformanceReviewHandler(RequestHandlerBase[DeletePerformanceReviewCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeletePerformanceReviewCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = PerformanceReviewRepository(uow.session)
                
                performancereview = repo.get_by_id(command.performancereview_id, command.tenant_id)
                if not performancereview:
                    return Result.failure("PerformanceReview not found")
                
                repo.delete(performancereview)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete performancereview: {str(e)}")
