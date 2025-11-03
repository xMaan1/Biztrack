from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeaveRequestRepository
from ....domain.entities.hrm_entity import LeaveRequest
from .command import UpdateLeaveRequestCommand

class UpdateLeaveRequestHandler(RequestHandlerBase[UpdateLeaveRequestCommand, Result[LeaveRequest]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateLeaveRequestCommand) -> Result[LeaveRequest]:
        try:
            with self._unit_of_work as uow:
                repo = LeaveRequestRepository(uow.session)
                
                leaverequest = repo.get_by_id(command.leaverequest_id, command.tenant_id)
                if not leaverequest:
                    return Result.failure("LeaveRequest not found")
                
                                if command.approvedAt is not None:
                    leaverequest.approvedAt = datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt else None
                if command.approvedBy is not None:
                    leaverequest.approvedBy = uuid.UUID(command.approvedBy) if command.approvedBy else None
                if command.comments is not None:
                    leaverequest.comments = command.comments
                if command.createdBy is not None:
                    leaverequest.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.days is not None:
                    leaverequest.days = command.days
                if command.employeeId is not None:
                    leaverequest.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.endDate is not None:
                    leaverequest.endDate = datetime.strptime(command.endDate, "%Y-%m-%d").date() if command.endDate else None
                if command.leaveType is not None:
                    leaverequest.leaveType = command.leaveType
                if command.reason is not None:
                    leaverequest.reason = command.reason
                if command.rejectionReason is not None:
                    leaverequest.rejectionReason = command.rejectionReason
                if command.startDate is not None:
                    leaverequest.startDate = datetime.strptime(command.startDate, "%Y-%m-%d").date() if command.startDate else None
                if command.status is not None:
                    leaverequest.status = command.status
                
                leaverequest.updatedAt = datetime.utcnow()
                repo.update(leaverequest)
                uow.commit()
                
                return Result.success(leaverequest)
                
        except Exception as e:
            return Result.failure(f"Failed to update leaverequest: {str(e)}")
