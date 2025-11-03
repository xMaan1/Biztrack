from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProjectRepository
from ....domain.entities.project_entity import Project
from ....domain.entities.core_entity import project_team_members
from ....domain.enums.project_enums import ProjectStatus, ProjectPriority
from .command import UpdateProjectCommand

class UpdateProjectHandler(RequestHandlerBase[UpdateProjectCommand, Result[Project]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateProjectCommand) -> Result[Project]:
        try:
            with self._unit_of_work as uow:
                project_repo = ProjectRepository(uow.session)
                
                project = project_repo.get_by_id(command.project_id, command.tenant_id)
                if not project:
                    return Result.failure("Project not found")
                
                if command.name is not None:
                    project.name = command.name
                if command.description is not None:
                    project.description = command.description
                if command.status is not None:
                    project.status = ProjectStatus(command.status) if isinstance(command.status, str) else command.status
                if command.priority is not None:
                    project.priority = ProjectPriority(command.priority) if isinstance(command.priority, str) else command.priority
                if command.startDate is not None:
                    project.startDate = datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else None
                if command.endDate is not None:
                    project.endDate = datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else None
                if command.completionPercent is not None:
                    project.completionPercent = command.completionPercent
                if command.budget is not None:
                    project.budget = command.budget
                if command.actualCost is not None:
                    project.actualCost = command.actualCost
                if command.notes is not None:
                    project.notes = command.notes
                if command.clientEmail is not None:
                    project.clientEmail = command.clientEmail
                if command.projectManagerId is not None:
                    import uuid
                    project.projectManagerId = uuid.UUID(command.projectManagerId) if command.projectManagerId else None
                
                if command.teamMemberIds is not None:
                    uow.session.execute(
                        project_team_members.delete().where(
                            project_team_members.c.project_id == project.id
                        )
                    )
                    for member_id in command.teamMemberIds:
                        uow.session.execute(
                            project_team_members.insert().values(
                                project_id=project.id,
                                user_id=uuid.UUID(member_id)
                            )
                        )
                
                project.updatedAt = datetime.utcnow()
                project_repo.update(project)
                uow.commit()
                
                return Result.success(project)
                
        except Exception as e:
            return Result.failure(f"Failed to update project: {str(e)}")

