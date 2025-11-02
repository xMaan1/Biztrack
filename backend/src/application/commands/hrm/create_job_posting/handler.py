from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JobPostingRepository
from ....domain.entities.hrm_entity import JobPosting
from .command import CreateJobPostingCommand

class CreateJobPostingHandler(RequestHandlerBase[CreateJobPostingCommand, Result[JobPosting]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateJobPostingCommand) -> Result[JobPosting]:
        try:
            with self._unit_of_work as uow:
                repo = JobPostingRepository(uow.session)
                
                posted_date = datetime.fromisoformat(command.openDate) if command.openDate else datetime.utcnow()
                closing_date = datetime.fromisoformat(command.closeDate) if command.closeDate else None
                
                entity = JobPosting(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    title=command.title,
                    department=command.department,
                    description=command.description,
                    requirements="\n".join(command.requirements) if command.requirements else None,
                    responsibilities=command.responsibilities or [],
                    salary=command.salaryRange,
                    location=command.location,
                    type=command.type,
                    status=command.status,
                    postedDate=posted_date,
                    closingDate=closing_date,
                    benefits=command.benefits or [],
                    hiringManagerId=uuid.UUID(command.hiringManagerId) if command.hiringManagerId else None,
                    tags=command.tags or [],
                    createdBy=uuid.UUID(command.created_by) if command.created_by else None,
                    isActive=True,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(entity)
                uow.commit()
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to create job posting: {str(e)}")

