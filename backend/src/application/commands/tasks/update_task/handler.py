from datetime import datetime
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TaskRepository
from ....domain.entities.project_entity import Task
from ....domain.enums.project_enums import TaskStatus, TaskPriority
from .command import UpdateTaskCommand

class UpdateTaskHandler(RequestHandlerBase[UpdateTaskCommand, Result[Task]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTaskCommand) -> Result[Task]:
        try:
            with self._unit_of_work as uow:
                task_repo = TaskRepository(uow.session)
                
                task = task_repo.get_by_id(command.task_id, command.tenant_id)
                if not task:
                    return Result.failure("Task not found")
                
                if command.title is not None:
                    task.title = command.title
                if command.description is not None:
                    task.description = command.description
                if command.status is not None:
                    task.status = TaskStatus(command.status) if isinstance(command.status, str) else command.status
                if command.priority is not None:
                    task.priority = TaskPriority(command.priority) if isinstance(command.priority, str) else command.priority
                if command.dueDate is not None:
                    task.dueDate = datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else None
                if command.assignedToId is not None:
                    import uuid
                    task.assignedToId = uuid.UUID(command.assignedToId) if command.assignedToId else None
                if command.estimatedHours is not None:
                    task.estimatedHours = command.estimatedHours
                if command.actualHours is not None:
                    task.actualHours = command.actualHours
                if command.tags is not None:
                    task.tags = json.dumps(command.tags)
                
                task.updatedAt = datetime.utcnow()
                task_repo.update(task)
                uow.commit()
                
                return Result.success(task)
                
        except Exception as e:
            return Result.failure(f"Failed to update task: {str(e)}")

