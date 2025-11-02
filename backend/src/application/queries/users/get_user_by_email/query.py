from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetUserByEmailQuery(IQuery):
    email: str

