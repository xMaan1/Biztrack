from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from ....core.command import ICommand

@dataclass
class CreateEmployeeCommand(ICommand):
    tenant_id: str
    userId: str
    employeeId: str
    department: str
    position: str
    hireDate: str
    salary: Optional[float] = None
    managerId: Optional[str] = None
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    attachments: List[str] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: List[str] = None
    certifications: List[str] = None
    employeeType: str = "full_time"
    employmentStatus: str = "active"

