from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ApplicationRepository
from ....domain.entities.hrm_entity import Application
from .command import UpdateApplicationCommand

class UpdateApplicationHandler(RequestHandlerBase[UpdateApplicationCommand, Result[Application]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateApplicationCommand) -> Result[Application]:
        try:
            with self._unit_of_work as uow:
                repo = ApplicationRepository(uow.session)
                
                application = repo.get_by_id(command.application_id, command.tenant_id)
                if not application:
                    return Result.failure("Application not found")
                
                                if command.assignedTo is not None:
                    application.assignedTo = uuid.UUID(command.assignedTo) if command.assignedTo else None
                if command.coverLetter is not None:
                    application.coverLetter = command.coverLetter
                if command.createdBy is not None:
                    application.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.education is not None:
                    application.education = command.education
                if command.email is not None:
                    application.email = command.email.lower() if command.email else None
                if command.experience is not None:
                    application.experience = command.experience
                if command.firstName is not None:
                    application.firstName = command.firstName
                if command.interviewDate is not None:
                    application.interviewDate = datetime.fromisoformat(command.interviewDate.replace('Z', '+00:00')) if command.interviewDate else None
                if command.interviewNotes is not None:
                    application.interviewNotes = command.interviewNotes
                if command.jobPostingId is not None:
                    application.jobPostingId = uuid.UUID(command.jobPostingId) if command.jobPostingId else None
                if command.lastName is not None:
                    application.lastName = command.lastName
                if command.notes is not None:
                    application.notes = command.notes
                if command.phone is not None:
                    application.phone = command.phone
                if command.resume is not None:
                    application.resume = command.resume
                if command.skills is not None:
                    application.skills = command.skills or []
                if command.status is not None:
                    application.status = command.status
                
                application.updatedAt = datetime.utcnow()
                repo.update(application)
                uow.commit()
                
                return Result.success(application)
                
        except Exception as e:
            return Result.failure(f"Failed to update application: {str(e)}")
