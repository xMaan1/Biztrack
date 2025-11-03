from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TaskRepository
from ....domain.entities.project_entity import Task
from .query import GetTaskByIdQuery

class GetTaskByIdHandler(RequestHandlerBase[GetTaskByIdQuery, Result[Optional[Task]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTaskByIdQuery) -> Result[Optional[Task]]:
        try:
            with self._unit_of_work as uow:
                task_repo = TaskRepository(uow.session)
                task = task_repo.get_by_id(query.task_id, query.tenant_id)
                return Result.success(task)
        except Exception as e:
            return Result.failure(f"Failed to get task: {str(e)}")

