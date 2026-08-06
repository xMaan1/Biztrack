from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db_session
from ....core.security import get_current_user
from ....core.dependencies import require_admin
from ....core.exceptions import NotFoundError
from ....schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from ....schemas.common import ResponseWrapper
from ....models.department import Department

router = APIRouter()


@router.get("/", response_model=ResponseWrapper)
async def get_departments(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Department)
    if search:
        query = query.filter(
            Department.name.ilike(f"%{search}%") |
            Department.code.ilike(f"%{search}%")
        )
    departments = query.all()
    return ResponseWrapper(
        success=True,
        message="Departments retrieved successfully",
        data=[DepartmentResponse.model_validate(d, from_attributes=True) for d in departments]
    )


@router.get("/{department_id}", response_model=ResponseWrapper)
async def get_department(
    department_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Department not found"}}
        )
    return ResponseWrapper(
        success=True,
        message="Department retrieved successfully",
        data=DepartmentResponse.model_validate(dept, from_attributes=True)
    )


@router.post("/", response_model=ResponseWrapper, status_code=status.HTTP_201_CREATED)
async def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    existing = db.query(Department).filter(
        (Department.name == data.name) | (Department.code == data.code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "CONFLICT", "message": "Department with this name or code already exists"}}
        )
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return ResponseWrapper(
        success=True,
        message="Department created successfully",
        data=DepartmentResponse.model_validate(dept, from_attributes=True)
    )


@router.put("/{department_id}", response_model=ResponseWrapper)
async def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Department not found"}}
        )
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(dept, key, val)
    db.commit()
    db.refresh(dept)
    return ResponseWrapper(
        success=True,
        message="Department updated successfully",
        data=DepartmentResponse.model_validate(dept, from_attributes=True)
    )


@router.delete("/{department_id}", response_model=ResponseWrapper)
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Department not found"}}
        )
    db.delete(dept)
    db.commit()
    return ResponseWrapper(
        success=True,
        message="Department deleted successfully"
    )
