from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContactRepository
from ....domain.entities.crm_entity import Contact
from .query import GetContactByIdQuery

class GetContactByIdHandler(RequestHandlerBase[GetContactByIdQuery, Result[Optional[Contact]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetContactByIdQuery) -> Result[Optional[Contact]]:
        try:
            with self._unit_of_work as uow:
                repo = ContactRepository(uow.session)
                entity = repo.get_by_id(query.contact_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get contact: {str(e)}")
