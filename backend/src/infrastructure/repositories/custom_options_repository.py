from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.custom_options_entity import (
    CustomEventType, CustomDepartment, CustomLeaveType, CustomLeadSource,
    CustomContactSource, CustomCompanyIndustry, CustomContactType, CustomIndustry
)

class CustomEventTypeRepository(BaseRepository[CustomEventType]):
    def __init__(self, session: Session):
        super().__init__(session, CustomEventType)

class CustomDepartmentRepository(BaseRepository[CustomDepartment]):
    def __init__(self, session: Session):
        super().__init__(session, CustomDepartment)

class CustomLeaveTypeRepository(BaseRepository[CustomLeaveType]):
    def __init__(self, session: Session):
        super().__init__(session, CustomLeaveType)

class CustomLeadSourceRepository(BaseRepository[CustomLeadSource]):
    def __init__(self, session: Session):
        super().__init__(session, CustomLeadSource)

class CustomContactSourceRepository(BaseRepository[CustomContactSource]):
    def __init__(self, session: Session):
        super().__init__(session, CustomContactSource)

class CustomCompanyIndustryRepository(BaseRepository[CustomCompanyIndustry]):
    def __init__(self, session: Session):
        super().__init__(session, CustomCompanyIndustry)

class CustomContactTypeRepository(BaseRepository[CustomContactType]):
    def __init__(self, session: Session):
        super().__init__(session, CustomContactType)

class CustomIndustryRepository(BaseRepository[CustomIndustry]):
    def __init__(self, session: Session):
        super().__init__(session, CustomIndustry)

