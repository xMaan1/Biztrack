from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentRepository
from .command import DeleteEquipmentCommand

class DeleteEquipmentHandler(RequestHandlerBase[DeleteEquipmentCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteEquipmentCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentRepository(uow.session)
                
                equipment = repo.get_by_id(command.equipment_id, command.tenant_id)
                if not equipment:
                    return Result.failure("Equipment not found")
                
                repo.delete(equipment)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete equipment: {str(e)}")
