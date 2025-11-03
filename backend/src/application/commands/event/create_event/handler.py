from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EventRepository
from ....domain.entities.event_entity import Event
from .command import CreateEventCommand

class CreateEventHandler(RequestHandlerBase[CreateEventCommand, Result[Event]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateEventCommand) -> Result[Event]:
        try:
            with self._unit_of_work as uow:
                repo = EventRepository(uow.session)
                
                event = Event(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    attachments=command.attachments or [],
                    createdById=uuid.UUID(command.createdById),
                    description=command.description,
                    discussionPoints=command.discussionPoints or [],
                    endDate=datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else datetime.utcnow(),
                    eventType=command.eventType,
                    googleCalendarEventId=command.googleCalendarEventId,
                    googleMeetLink=command.googleMeetLink,
                    isOnline=command.isOnline,
                    location=command.location,
                    participants=command.participants or [],
                    projectId=uuid.UUID(command.projectId),
                    recurrenceData=command.recurrenceData or [],
                    recurrenceType=command.recurrenceType,
                    reminderMinutes=command.reminderMinutes,
                    startDate=datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else datetime.utcnow(),
                    status=command.status,
                    timezone=command.timezone,
                    title=command.title,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(event)
                uow.commit()
                return Result.success(event)
                
        except Exception as e:
            return Result.failure(f"Failed to create event: {str(e)}")
