from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.event_entity import Event

class EventRepository(BaseRepository[Event]):
    def __init__(self, session: Session):
        super().__init__(session, Event)

    def get_by_project(self, project_id: str, tenant_id: Optional[str] = None) -> List[Event]:
        query = self._session.query(Event).filter(Event.projectId == project_id)
        if tenant_id:
            query = query.filter(Event.tenant_id == tenant_id)
        return query.all()

