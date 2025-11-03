from datetime import datetime
import uuid
from datetime import date
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeaveRequestRepository
from ....domain.entities.hrm_entity import LeaveRequest
from .command import CreateLeaveRequestCommand

class CreateLeaveRequestHandler(RequestHandlerBase[CreateLeaveRequestCommand, Result[LeaveRequest]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateLeaveRequestCommand) -> Result[LeaveRequest]:
        try:
            with self._unit_of_work as uow:
                repo = LeaveRequestRepository(uow.session)
                
                leaverequest = LeaveRequest(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    approvedAt=datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt else datetime.utcnow(),
                    approvedBy=uuid.UUID(command.approvedBy),
                    comments=command.comments,
                    createdBy=uuid.UUID(command.createdBy),
                    days=command.days,
                    employeeId=uuid.UUID(command.employeeId),
                    endDate=datetime.strptime(command.endDate, "%Y-%m-%d").date() if command.endDate else datetime.now().date(),
                    leaveType=command.leaveType,
                    reason=command.reason,
                    rejectionReason=command.rejectionReason,
                    startDate=datetime.strptime(command.startDate, "%Y-%m-%d").date() if command.startDate else datetime.now().date(),
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(leaverequest)
                uow.commit()
                return Result.success(leaverequest)
                
        except Exception as e:
            return Result.failure(f"Failed to create leaverequest: {str(e)}")
