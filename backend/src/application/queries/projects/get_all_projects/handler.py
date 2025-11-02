from typing import List
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProjectRepository
from ....domain.entities.project_entity import Project
from .query import GetAllProjectsQuery

class GetAllProjectsHandler(RequestHandlerBase[GetAllProjectsQuery, Result[PagedResult[Project]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllProjectsQuery) -> Result[PagedResult[Project]]:
        try:
            with self._unit_of_work as uow:
                project_repo = ProjectRepository(uow.session)
                
                skip = query.skip
                projects = project_repo.get_all(
                    tenant_id=query.tenant_id,
                    skip=skip,
                    limit=query.page_size,
                    order_by=query.sort_by,
                    order_desc=(query.sort_order == 'desc')
                )
                
                total_count = project_repo.count(query.tenant_id)
                
                paged_result = PagedResult(
                    items=projects,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get projects: {str(e)}")

