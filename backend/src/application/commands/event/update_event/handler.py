from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EventRepository
from ....domain.entities.event_entity import Event
from .command import UpdateEventCommand

class UpdateEventHandler(RequestHandlerBase[UpdateEventCommand, Result[Event]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateEventCommand) -> Result[Event]:
        try:
            with self._unit_of_work as uow:
                repo = EventRepository(uow.session)
                
                event = repo.get_by_id(command.event_id, command.tenant_id)
                if not event:
                    return Result.failure("Event not found")
                
                                if command.attachments is not None:
                    event.attachments = command.attachments or []
                if command.createdById is not None:
                    event.createdById = uuid.UUID(command.createdById) if command.createdById else None
                if command.description is not None:
                    event.description = command.description
                if command.discussionPoints is not None:
                    event.discussionPoints = command.discussionPoints or []
                if command.endDate is not None:
                    event.endDate = datetime.fromisoformat(command.endDate.replace('Z', '+00:00')) if command.endDate else None
                if command.eventType is not None:
                    event.eventType = command.eventType
                if command.googleCalendarEventId is not None:
                    event.googleCalendarEventId = command.googleCalendarEventId
                if command.googleMeetLink is not None:
                    event.googleMeetLink = command.googleMeetLink
                if command.isOnline is not None:
                    event.isOnline = command.isOnline
                if command.location is not None:
                    event.location = command.location
                if command.participants is not None:
                    event.participants = command.participants or []
                if command.projectId is not None:
                    event.projectId = uuid.UUID(command.projectId) if command.projectId else None
                if command.recurrenceData is not None:
                    event.recurrenceData = command.recurrenceData or []
                if command.recurrenceType is not None:
                    event.recurrenceType = command.recurrenceType
                if command.reminderMinutes is not None:
                    event.reminderMinutes = command.reminderMinutes
                if command.startDate is not None:
                    event.startDate = datetime.fromisoformat(command.startDate.replace('Z', '+00:00')) if command.startDate else None
                if command.status is not None:
                    event.status = command.status
                if command.timezone is not None:
                    event.timezone = command.timezone
                if command.title is not None:
                    event.title = command.title
                
                event.updatedAt = datetime.utcnow()
                repo.update(event)
                uow.commit()
                
                return Result.success(event)
                
        except Exception as e:
            return Result.failure(f"Failed to update event: {str(e)}")
