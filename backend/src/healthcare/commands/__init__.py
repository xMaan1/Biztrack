from .doctors import create_doctor_handler, update_doctor_handler, delete_doctor_handler
from .patients import create_patient_handler, update_patient_handler, delete_patient_handler
from .appointments import (
    create_appointment_handler,
    update_appointment_handler,
    delete_appointment_handler,
)
from .prescriptions import (
    create_prescription_handler,
    update_prescription_handler,
    delete_prescription_handler,
)
from .staff import (
    create_healthcare_staff_handler,
    update_healthcare_staff_handler,
    delete_healthcare_staff_handler,
)
from .expense_categories import (
    create_expense_category_handler,
    update_expense_category_handler,
    delete_expense_category_handler,
)
from .expenses import (
    create_daily_expense_handler,
    update_daily_expense_handler,
    delete_daily_expense_handler,
)
from .admissions import (
    create_admission_handler,
    update_admission_handler,
    delete_admission_handler,
)

__all__ = [
    "create_doctor_handler",
    "update_doctor_handler",
    "delete_doctor_handler",
    "create_patient_handler",
    "update_patient_handler",
    "delete_patient_handler",
    "create_appointment_handler",
    "update_appointment_handler",
    "delete_appointment_handler",
    "create_prescription_handler",
    "update_prescription_handler",
    "delete_prescription_handler",
    "create_healthcare_staff_handler",
    "update_healthcare_staff_handler",
    "delete_healthcare_staff_handler",
    "create_expense_category_handler",
    "update_expense_category_handler",
    "delete_expense_category_handler",
    "create_daily_expense_handler",
    "update_daily_expense_handler",
    "delete_daily_expense_handler",
    "create_admission_handler",
    "update_admission_handler",
    "delete_admission_handler",
]
