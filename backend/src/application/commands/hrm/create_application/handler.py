from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ApplicationRepository
from ....domain.entities.hrm_entity import Application
from .command import CreateApplicationCommand

class CreateApplicationHandler(RequestHandlerBase[CreateApplicationCommand, Result[Application]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateApplicationCommand) -> Result[Application]:
        try:
            with self._unit_of_work as uow:
                repo = ApplicationRepository(uow.session)
                
                application = Application(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    assignedTo=uuid.UUID(command.assignedTo),
                    coverLetter=command.coverLetter,
                    createdBy=uuid.UUID(command.createdBy),
                    education=command.education,
                    email=command.email.lower() if command.email else None,
                    experience=command.experience,
                    firstName=command.firstName,
                    interviewDate=datetime.fromisoformat(command.interviewDate.replace('Z', '+00:00')) if command.interviewDate else None,
                    interviewNotes=command.interviewNotes,
                    jobPostingId=uuid.UUID(command.jobPostingId),
                    lastName=command.lastName,
                    notes=command.notes,
                    phone=command.phone,
                    resume=command.resume,
                    skills=command.skills or [],
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(application)
                uow.commit()
                return Result.success(application)
                
        except Exception as e:
            return Result.failure(f"Failed to create application: {str(e)}")
