from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PerformanceReviewRepository
from ....domain.entities.hrm_entity import PerformanceReview
from .command import UpdatePerformanceReviewCommand

class UpdatePerformanceReviewHandler(RequestHandlerBase[UpdatePerformanceReviewCommand, Result[PerformanceReview]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePerformanceReviewCommand) -> Result[PerformanceReview]:
        try:
            with self._unit_of_work as uow:
                repo = PerformanceReviewRepository(uow.session)
                
                performancereview = repo.get_by_id(command.performancereview_id, command.tenant_id)
                if not performancereview:
                    return Result.failure("PerformanceReview not found")
                
                                if command.areasForImprovement is not None:
                    performancereview.areasForImprovement = command.areasForImprovement
                if command.comments is not None:
                    performancereview.comments = command.comments
                if command.communicationRating is not None:
                    performancereview.communicationRating = command.communicationRating
                if command.createdBy is not None:
                    performancereview.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.employeeId is not None:
                    performancereview.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.goals is not None:
                    performancereview.goals = command.goals
                if command.isCompleted is not None:
                    performancereview.isCompleted = command.isCompleted
                if command.leadershipRating is not None:
                    performancereview.leadershipRating = command.leadershipRating
                if command.nextReviewDate is not None:
                    performancereview.nextReviewDate = datetime.fromisoformat(command.nextReviewDate.replace('Z', '+00:00')) if command.nextReviewDate else None
                if command.rating is not None:
                    performancereview.rating = command.rating
                if command.reviewDate is not None:
                    performancereview.reviewDate = datetime.fromisoformat(command.reviewDate.replace('Z', '+00:00')) if command.reviewDate else None
                if command.reviewPeriod is not None:
                    performancereview.reviewPeriod = command.reviewPeriod
                if command.reviewType is not None:
                    performancereview.reviewType = command.reviewType
                if command.reviewerId is not None:
                    performancereview.reviewerId = uuid.UUID(command.reviewerId) if command.reviewerId else None
                if command.strengths is not None:
                    performancereview.strengths = command.strengths
                if command.teamworkRating is not None:
                    performancereview.teamworkRating = command.teamworkRating
                if command.technicalRating is not None:
                    performancereview.technicalRating = command.technicalRating
                
                performancereview.updatedAt = datetime.utcnow()
                repo.update(performancereview)
                uow.commit()
                
                return Result.success(performancereview)
                
        except Exception as e:
            return Result.failure(f"Failed to update performancereview: {str(e)}")
