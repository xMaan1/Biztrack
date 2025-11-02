from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateEmployeeCommand(ICommand):
    employee_id: str
    tenant_id: str
    department: Optional[str] = None
    position: Optional[str] = None
    hireDate: Optional[str] = None
    salary: Optional[float] = None
    managerId: Optional[str] = None
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    attachments: Optional[List[str]] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    employeeType: Optional[str] = None
    employmentStatus: Optional[str] = None

