from typing import List
from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TaskRepository
from ....domain.entities.project_entity import Task
from .query import GetAllTasksQuery

class GetAllTasksHandler(RequestHandlerBase[GetAllTasksQuery, Result[PagedResult[Task]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllTasksQuery) -> Result[PagedResult[Task]]:
        try:
            with self._unit_of_work as uow:
                task_repo = TaskRepository(uow.session)
                import uuid
                
                skip = query.skip
                
                filters = []
                if query.tenant_id:
                    filters.append(Task.tenant_id == uuid.UUID(query.tenant_id))
                if query.project_id:
                    filters.append(Task.projectId == uuid.UUID(query.project_id))
                
                base_query = task_repo._session.query(Task)
                if filters:
                    base_query = base_query.filter(and_(*filters))
                
                total_count = base_query.count()
                
                sort_column = Task.createdAt if hasattr(Task, 'createdAt') else Task.id
                order_func = desc if query.sort_order == "desc" else asc
                tasks = base_query.order_by(order_func(sort_column)).offset(skip).limit(query.page_size).all()
                
                paged_result = PagedResult(
                    items=tasks,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get tasks: {str(e)}")

