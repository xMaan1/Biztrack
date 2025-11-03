from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeaveRequestRepository
from ....domain.entities.hrm_entity import LeaveRequest
from .query import GetLeaveRequestByIdQuery

class GetLeaveRequestByIdHandler(RequestHandlerBase[GetLeaveRequestByIdQuery, Result[Optional[LeaveRequest]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetLeaveRequestByIdQuery) -> Result[Optional[LeaveRequest]]:
        try:
            with self._unit_of_work as uow:
                repo = LeaveRequestRepository(uow.session)
                entity = repo.get_by_id(query.leaverequest_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get leaverequest: {str(e)}")
