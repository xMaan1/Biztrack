from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingRepository
from ....domain.entities.hrm_entity import Training
from .command import CreateTrainingCommand

class CreateTrainingHandler(RequestHandlerBase[CreateTrainingCommand, Result[Training]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTrainingCommand) -> Result[Training]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingRepository(uow.session)
                
                training = Training(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    cost=command.cost,
                    createdBy=uuid.UUID(command.createdBy),
                    description=command.description,
                    duration=command.duration,
                    endDate=datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else datetime.utcnow(),
                    materials=command.materials or [],
                    maxParticipants=command.maxParticipants,
                    objectives=command.objectives or [],
                    prerequisites=command.prerequisites or [],
                    provider=command.provider,
                    startDate=datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else datetime.utcnow(),
                    status=command.status,
                    title=command.title,
                    trainingType=command.trainingType,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(training)
                uow.commit()
                return Result.success(training)
                
        except Exception as e:
            return Result.failure(f"Failed to create training: {str(e)}")
