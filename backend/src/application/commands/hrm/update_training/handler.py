from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingRepository
from ....domain.entities.hrm_entity import Training
from .command import UpdateTrainingCommand

class UpdateTrainingHandler(RequestHandlerBase[UpdateTrainingCommand, Result[Training]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTrainingCommand) -> Result[Training]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingRepository(uow.session)
                
                training = repo.get_by_id(command.training_id, command.tenant_id)
                if not training:
                    return Result.failure("Training not found")
                
                                if command.cost is not None:
                    training.cost = command.cost
                if command.createdBy is not None:
                    training.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.description is not None:
                    training.description = command.description
                if command.duration is not None:
                    training.duration = command.duration
                if command.endDate is not None:
                    training.endDate = datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else None
                if command.materials is not None:
                    training.materials = command.materials or []
                if command.maxParticipants is not None:
                    training.maxParticipants = command.maxParticipants
                if command.objectives is not None:
                    training.objectives = command.objectives or []
                if command.prerequisites is not None:
                    training.prerequisites = command.prerequisites or []
                if command.provider is not None:
                    training.provider = command.provider
                if command.startDate is not None:
                    training.startDate = datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else None
                if command.status is not None:
                    training.status = command.status
                if command.title is not None:
                    training.title = command.title
                if command.trainingType is not None:
                    training.trainingType = command.trainingType
                
                training.updatedAt = datetime.utcnow()
                repo.update(training)
                uow.commit()
                
                return Result.success(training)
                
        except Exception as e:
            return Result.failure(f"Failed to update training: {str(e)}")
