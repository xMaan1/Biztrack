from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PerformanceReviewRepository
from ....domain.entities.hrm_entity import PerformanceReview
from .command import CreatePerformanceReviewCommand

class CreatePerformanceReviewHandler(RequestHandlerBase[CreatePerformanceReviewCommand, Result[PerformanceReview]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePerformanceReviewCommand) -> Result[PerformanceReview]:
        try:
            with self._unit_of_work as uow:
                repo = PerformanceReviewRepository(uow.session)
                
                performancereview = PerformanceReview(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    areasForImprovement=command.areasForImprovement,
                    comments=command.comments,
                    communicationRating=command.communicationRating,
                    createdBy=uuid.UUID(command.createdBy),
                    employeeId=uuid.UUID(command.employeeId),
                    goals=command.goals,
                    isCompleted=command.isCompleted,
                    leadershipRating=command.leadershipRating,
                    nextReviewDate=datetime.fromisoformat(command.nextReviewDate.replace('Z', '+00:00')) if command.nextReviewDate else datetime.utcnow(),
                    rating=command.rating,
                    reviewDate=datetime.fromisoformat(command.reviewDate.replace('Z', '+00:00')) if command.reviewDate else datetime.utcnow(),
                    reviewPeriod=command.reviewPeriod,
                    reviewType=command.reviewType,
                    reviewerId=uuid.UUID(command.reviewerId),
                    strengths=command.strengths,
                    teamworkRating=command.teamworkRating,
                    technicalRating=command.technicalRating,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(performancereview)
                uow.commit()
                return Result.success(performancereview)
                
        except Exception as e:
            return Result.failure(f"Failed to create performancereview: {str(e)}")
