from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JobPostingRepository
from ....domain.entities.hrm_entity import JobPosting
from .command import UpdateJobPostingCommand

class UpdateJobPostingHandler(RequestHandlerBase[UpdateJobPostingCommand, Result[JobPosting]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateJobPostingCommand) -> Result[JobPosting]:
        try:
            with self._unit_of_work as uow:
                repo = JobPostingRepository(uow.session)
                
                job = repo.get_by_id(command.job_id, command.tenant_id)
                if not job:
                    return Result.failure("Job posting not found")
                
                if command.title is not None:
                    job.title = command.title
                if command.department is not None:
                    job.department = command.department
                if command.description is not None:
                    job.description = command.description
                if command.requirements is not None:
                    job.requirements = "\n".join(command.requirements)
                if command.responsibilities is not None:
                    job.responsibilities = command.responsibilities
                if command.location is not None:
                    job.location = command.location
                if command.type is not None:
                    job.type = command.type
                if command.salaryRange is not None:
                    job.salary = command.salaryRange
                if command.benefits is not None:
                    job.benefits = command.benefits
                if command.status is not None:
                    job.status = command.status
                if command.openDate is not None:
                    job.postedDate = datetime.fromisoformat(command.openDate)
                if command.closeDate is not None:
                    job.closingDate = datetime.fromisoformat(command.closeDate) if command.closeDate else None
                if command.hiringManagerId is not None:
                    import uuid
                    job.hiringManagerId = uuid.UUID(command.hiringManagerId) if command.hiringManagerId else None
                if command.tags is not None:
                    job.tags = command.tags
                
                job.updatedAt = datetime.utcnow()
                repo.update(job)
                uow.commit()
                
                return Result.success(job)
        except Exception as e:
            return Result.failure(f"Failed to update job posting: {str(e)}")

