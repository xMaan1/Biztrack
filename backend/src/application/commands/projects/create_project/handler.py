from datetime import datetime
from typing import Optional
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProjectRepository
from ....domain.entities.project_entity import Project
from ....domain.entities.core_entity import project_team_members
from ....domain.enums.project_enums import ProjectStatus, ProjectPriority
from .command import CreateProjectCommand

class CreateProjectHandler(RequestHandlerBase[CreateProjectCommand, Result[Project]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateProjectCommand) -> Result[Project]:
        try:
            with self._unit_of_work as uow:
                project_repo = ProjectRepository(uow.session)
                
                project_status = ProjectStatus(command.status) if isinstance(command.status, str) else command.status
                project_priority = ProjectPriority(command.priority) if isinstance(command.priority, str) else command.priority
                
                start_date = None
                end_date = None
                if command.startDate:
                    start_date = datetime.fromisoformat(command.startDate.replace('Z', '+00:00'))
                if command.endDate:
                    end_date = datetime.fromisoformat(command.endDate.replace('Z', '+00:00'))
                
                project_entity = Project(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    name=command.name,
                    description=command.description,
                    status=project_status,
                    priority=project_priority,
                    startDate=start_date,
                    endDate=end_date,
                    completionPercent=command.completionPercent,
                    budget=command.budget,
                    actualCost=command.actualCost,
                    notes=command.notes,
                    clientEmail=command.clientEmail,
                    projectManagerId=uuid.UUID(command.projectManagerId) if command.projectManagerId else None,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                project_repo.add(project_entity)
                
                if command.teamMemberIds:
                    for member_id in command.teamMemberIds:
                        uow.session.execute(
                            project_team_members.insert().values(
                                project_id=project_entity.id,
                                user_id=uuid.UUID(member_id)
                            )
                        )
                
                uow.commit()
                return Result.success(project_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create project: {str(e)}")

