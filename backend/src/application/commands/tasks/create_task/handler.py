from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TaskRepository
from ....domain.entities.project_entity import Task
from ....domain.enums.project_enums import TaskStatus, TaskPriority
from .command import CreateTaskCommand

class CreateTaskHandler(RequestHandlerBase[CreateTaskCommand, Result[Task]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTaskCommand) -> Result[Task]:
        try:
            with self._unit_of_work as uow:
                task_repo = TaskRepository(uow.session)
                
                task_entity = Task(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    projectId=uuid.UUID(command.projectId),
                    title=command.title,
                    description=command.description,
                    status=TaskStatus(command.status) if isinstance(command.status, str) else command.status,
                    priority=TaskPriority(command.priority) if isinstance(command.priority, str) else command.priority,
                    dueDate=datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else None,
                    assignedToId=uuid.UUID(command.assignedToId) if command.assignedToId else None,
                    createdById=uuid.UUID(command.createdById) if command.createdById else None,
                    parentTaskId=uuid.UUID(command.parentTaskId) if command.parentTaskId else None,
                    estimatedHours=command.estimatedHours,
                    tags=json.dumps(command.tags) if command.tags else None,
                    isActive=True,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                task_repo.add(task_entity)
                uow.commit()
                return Result.success(task_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create task: {str(e)}")

