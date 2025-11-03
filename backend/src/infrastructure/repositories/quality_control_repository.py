from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.quality_control_entity import QualityCheck, QualityInspection, QualityDefect, QualityReport

class QualityCheckRepository(BaseRepository[QualityCheck]):
    def __init__(self, session: Session):
        super().__init__(session, QualityCheck)

    def get_by_check_number(self, check_number: str, tenant_id: Optional[str] = None) -> Optional[QualityCheck]:
        query = self._session.query(QualityCheck).filter(QualityCheck.check_number == check_number)
        if tenant_id:
            query = query.filter(QualityCheck.tenant_id == tenant_id)
        return query.first()

class QualityInspectionRepository(BaseRepository[QualityInspection]):
    def __init__(self, session: Session):
        super().__init__(session, QualityInspection)

    def get_by_quality_check(self, quality_check_id: str, tenant_id: Optional[str] = None) -> List[QualityInspection]:
        query = self._session.query(QualityInspection).filter(
            QualityInspection.quality_check_id == quality_check_id
        )
        if tenant_id:
            query = query.filter(QualityInspection.tenant_id == tenant_id)
        return query.all()

class QualityDefectRepository(BaseRepository[QualityDefect]):
    def __init__(self, session: Session):
        super().__init__(session, QualityDefect)

    def get_by_defect_number(self, defect_number: str, tenant_id: Optional[str] = None) -> Optional[QualityDefect]:
        query = self._session.query(QualityDefect).filter(QualityDefect.defect_number == defect_number)
        if tenant_id:
            query = query.filter(QualityDefect.tenant_id == tenant_id)
        return query.first()

class QualityReportRepository(BaseRepository[QualityReport]):
    def __init__(self, session: Session):
        super().__init__(session, QualityReport)

    def get_by_report_number(self, report_number: str, tenant_id: Optional[str] = None) -> Optional[QualityReport]:
        query = self._session.query(QualityReport).filter(QualityReport.report_number == report_number)
        if tenant_id:
            query = query.filter(QualityReport.tenant_id == tenant_id)
        return query.first()

