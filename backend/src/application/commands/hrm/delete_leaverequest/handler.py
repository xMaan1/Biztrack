from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeaveRequestRepository
from .command import DeleteLeaveRequestCommand

class DeleteLeaveRequestHandler(RequestHandlerBase[DeleteLeaveRequestCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteLeaveRequestCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = LeaveRequestRepository(uow.session)
                
                leaverequest = repo.get_by_id(command.leaverequest_id, command.tenant_id)
                if not leaverequest:
                    return Result.failure("LeaveRequest not found")
                
                repo.delete(leaverequest)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete leaverequest: {str(e)}")
