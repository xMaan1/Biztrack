from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
import json
import uuid
from datetime import datetime, timedelta

from ...models.unified_models import (
    Project, ProjectCreate, ProjectUpdate, ProjectsResponse, TeamMember,
    TasksResponse, Task, TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse
)
from ...config.database import (
    get_db, get_user_by_id, create_project, get_project_by_id,
    get_all_projects, update_project, delete_project, get_tasks_by_project,
    get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry,
    User, Project as DBProject, Task as DBTask
)
from ...config.hrm_models import TimeEntry as DBTimeEntry, Employee as DBEmployee
from ...presentation.dependencies.auth import get_current_user, get_tenant_context, require_tenant_admin_or_super_admin
from ...presentation.dependencies.mediator import get_mediator
from ...core.mediator import Mediator
from ...core.result import Result
from ...application.commands import (
    CreateProjectCommand, UpdateProjectCommand, DeleteProjectCommand
)
from ...application.queries import (
    GetProjectByIdQuery, GetAllProjectsQuery
)

router = APIRouter(prefix="/projects", tags=["projects"])

def transform_user_to_team_member(user: User) -> TeamMember:
    """Transform a User to TeamMember format"""
    return TeamMember(
        id=str(user.id),
        name=f"{user.firstName or ''} {user.lastName or ''}".strip() or user.userName,
        email=user.email,
        role=user.userRole,
        avatar=user.avatar
    )

def transform_db_time_entry_to_pydantic(db_entry: DBTimeEntry) -> TimeEntry:
    """Transform SQLAlchemy TimeEntry to Pydantic TimeEntry"""
    return TimeEntry(
        id=str(db_entry.id),
        employeeId=str(db_entry.employeeId),
        date=db_entry.date.isoformat() if db_entry.date else "",
        clockIn=db_entry.startTime.isoformat() if db_entry.startTime else "",
        clockOut=db_entry.endTime.isoformat() if db_entry.endTime else None,
        totalHours=db_entry.hours if db_entry.hours else None,
        overtimeHours=None,
        projectId=str(db_entry.projectId) if db_entry.projectId else None,
        taskId=str(db_entry.taskId) if db_entry.taskId else None,
        notes=db_entry.description,
        status="active" if db_entry.endTime is None else "completed",
        tenant_id=str(db_entry.tenant_id),
        createdBy=str(db_entry.createdAt) if db_entry.createdAt else "",
        createdAt=db_entry.createdAt.isoformat() if db_entry.createdAt else "",
        updatedAt=db_entry.updatedAt.isoformat() if db_entry.updatedAt else ""
    )

def transform_project_to_response(project: DBProject) -> Project:
    """Transform database project to response format"""
    return Project(
        id=str(project.id),
        tenant_id=str(project.tenant_id),
        name=project.name,
        description=project.description,
        status=project.status.value if hasattr(project.status, 'value') else project.status,
        priority=project.priority.value if hasattr(project.priority, 'value') else project.priority,
        startDate=project.startDate,
        endDate=project.endDate,
        completionPercent=project.completionPercent,
        budget=project.budget,
        actualCost=project.actualCost,
        notes=project.notes,
        clientEmail=project.clientEmail,
        projectManagerId=str(project.projectManagerId),
        projectManager=transform_user_to_team_member(project.projectManager),
        teamMembers=[transform_user_to_team_member(member) for member in project.teamMembers],
        createdAt=project.createdAt,
        updatedAt=project.updatedAt,
        activities=[]  # TODO: Implement activities
    )

def transform_project_to_response_from_entity(project_entity, db: Session) -> Project:
    """Transform domain entity to response format"""
    project_manager = get_user_by_id(str(project_entity.projectManagerId), db) if project_entity.projectManagerId else None
    team_members = []
    if hasattr(project_entity, 'teamMembers'):
        for member in project_entity.teamMembers:
            if hasattr(member, 'id'):
                user = get_user_by_id(str(member.id), db)
                if user:
                    team_members.append(transform_user_to_team_member(user))
    
    return Project(
        id=str(project_entity.id),
        tenant_id=str(project_entity.tenant_id),
        name=project_entity.name,
        description=project_entity.description,
        status=project_entity.status.value if hasattr(project_entity.status, 'value') else str(project_entity.status),
        priority=project_entity.priority.value if hasattr(project_entity.priority, 'value') else str(project_entity.priority),
        startDate=project_entity.startDate.isoformat() if hasattr(project_entity.startDate, 'isoformat') else project_entity.startDate,
        endDate=project_entity.endDate.isoformat() if project_entity.endDate and hasattr(project_entity.endDate, 'isoformat') else project_entity.endDate,
        completionPercent=project_entity.completionPercent,
        budget=project_entity.budget,
        actualCost=project_entity.actualCost,
        notes=project_entity.notes,
        clientEmail=project_entity.clientEmail,
        projectManagerId=str(project_entity.projectManagerId) if project_entity.projectManagerId else "",
        projectManager=transform_user_to_team_member(project_manager) if project_manager else None,
        teamMembers=team_members,
        createdAt=project_entity.createdAt.isoformat() if hasattr(project_entity.createdAt, 'isoformat') else project_entity.createdAt,
        updatedAt=project_entity.updatedAt.isoformat() if hasattr(project_entity.updatedAt, 'isoformat') else project_entity.updatedAt,
        activities=[]
    )

@router.get("", response_model=ProjectsResponse)
async def get_projects(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get all projects with optional filtering (tenant-scoped)"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllProjectsQuery(
        page=page,
        page_size=limit,
        search_term=search,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    projects_data = result.value
    projects = projects_data.get("items", []) if isinstance(projects_data, dict) else []
    total = projects_data.get("total", len(projects)) if isinstance(projects_data, dict) else len(projects)
    
    project_list = []
    for project_entity in projects:
        if hasattr(project_entity, 'id'):
            project = transform_project_to_response_from_entity(project_entity, db)
            project_list.append(project)
        else:
            project_list.append(transform_project_to_response(project_entity))
    
    if status:
        project_list = [p for p in project_list if p.status == status]
    if priority:
        project_list = [p for p in project_list if p.priority == priority]
    
    return ProjectsResponse(
        projects=project_list,
        pagination={
            "page": page,
            "limit": limit,
            "total": len(project_list) if status or priority else total,
            "pages": (len(project_list) if status or priority else total + limit - 1) // limit
        }
    )

# Time Tracking endpoints
@router.get("/time-entries", response_model=HRMTimeEntriesResponse)
async def get_project_time_entries(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all time entries with optional filtering"""
    try:
        skip = (page - 1) * limit
        time_entries = get_time_entries(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or start_date or end_date or project_id:
            filtered_entries = []
            for entry in time_entries:
                if employee_id and entry.employeeId != employee_id:
                    continue
                if start_date and entry.date < start_date:
                    continue
                if end_date and entry.date > end_date:
                    continue
                if project_id and project_id != "all" and entry.projectId != project_id:
                    continue
                filtered_entries.append(entry)
            time_entries = filtered_entries
        
        # Get total count for pagination
        total = len(time_entries)
        
        # Transform SQLAlchemy objects to Pydantic models
        transformed_entries = [transform_db_time_entry_to_pydantic(entry) for entry in time_entries]
        
        return HRMTimeEntriesResponse(
            timeEntries=transformed_entries,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entries: {str(e)}")

@router.post("/time-entries", response_model=TimeEntry)
async def create_project_time_entry(
    time_entry_data: TimeEntryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new time entry"""
    try:
        time_entry = TimeEntry(
            id=str(uuid.uuid4()),
            **time_entry_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating time entry: {str(e)}")

@router.get("/time-entries/{entry_id}", response_model=TimeEntry)
async def get_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific time entry by ID"""
    try:
        time_entry = get_time_entry_by_id(db, entry_id, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return time_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entry: {str(e)}")

@router.put("/time-entries/{entry_id}", response_model=TimeEntry)
async def update_project_time_entry(
    entry_id: str,
    time_entry_data: TimeEntryUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a time entry"""
    try:
        time_entry = update_time_entry(db, entry_id, time_entry_data.dict(), tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return time_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating time entry: {str(e)}")

@router.delete("/time-entries/{entry_id}")
async def delete_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a time entry"""
    try:
        success = delete_time_entry(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return {"message": "Time entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting time entry: {str(e)}")

@router.post("/time-entries/{entry_id}/approve", response_model=TimeEntry)
async def approve_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Approve a time entry"""
    try:
        time_entry = get_time_entry_by_id(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        time_entry.isApproved = True
        time_entry.approvedBy = str(current_user.id)
        time_entry.approvedAt = datetime.now()
        time_entry.status = "approved"
        
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error approving time entry: {str(e)}")

@router.post("/time-entries/{entry_id}/reject", response_model=TimeEntry)
async def reject_project_time_entry(
    entry_id: str,
    rejection_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Reject a time entry"""
    try:
        time_entry = get_time_entry_by_id(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        time_entry.isApproved = False
        time_entry.approvedBy = str(current_user.id)
        time_entry.approvedAt = datetime.now()
        time_entry.status = "rejected"
        time_entry.notes = f"{time_entry.notes or ''}\nRejection reason: {rejection_data.get('reason', 'No reason provided')}"
        
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error rejecting time entry: {str(e)}")

@router.get("/time-tracking/dashboard")
async def get_project_time_tracking_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get time tracking dashboard data"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get recent time entries
        recent_entries = get_time_entries(db, tenant_id, 0, 10)
        
        # Get current active session (if any)
        current_session = None
        
        # Get basic stats
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Calculate stats from time entries
        all_entries = get_time_entries(db, tenant_id, 0, 1000)
        
        today_hours = sum(entry.hours or 0 for entry in all_entries if entry.date == today)
        week_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= week_start)
        month_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= month_start)
        total_hours = sum(entry.hours or 0 for entry in all_entries)
        
        stats = {
            "todayHours": today_hours,
            "weekHours": week_hours,
            "monthHours": month_hours,
            "totalHours": total_hours,
            "averageDailyHours": total_hours / max(1, len(set(entry.date.isoformat() for entry in all_entries))),
            "overtimeHours": max(0, total_hours - (len(set(entry.date.isoformat() for entry in all_entries)) * 8))
        }
        
        return {
            "stats": stats,
            "recentEntries": recent_entries,
            "currentSession": current_session
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time tracking dashboard: {str(e)}")

@router.get("/time-tracking/stats")
async def get_project_time_tracking_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get time tracking statistics"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get time entries with filters
        all_entries = get_time_entries(db, tenant_id, 0, 1000)
        
        # Apply filters
        if employee_id:
            all_entries = [entry for entry in all_entries if str(entry.employeeId) == employee_id]
        if start_date:
            all_entries = [entry for entry in all_entries if entry.date.isoformat() >= start_date]
        if end_date:
            all_entries = [entry for entry in all_entries if entry.date.isoformat() <= end_date]
        
        # Calculate stats
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        today_hours = sum(entry.hours or 0 for entry in all_entries if entry.date == today)
        week_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= week_start)
        month_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= month_start)
        total_hours = sum(entry.hours or 0 for entry in all_entries)
        
        unique_days = len(set(entry.date.isoformat() for entry in all_entries))
        average_daily_hours = total_hours / max(1, unique_days)
        overtime_hours = max(0, total_hours - (unique_days * 8))
        
        return {
            "todayHours": today_hours,
            "weekHours": week_hours,
            "monthHours": month_hours,
            "totalHours": total_hours,
            "averageDailyHours": average_daily_hours,
            "overtimeHours": overtime_hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time tracking stats: {str(e)}")

@router.get("/time-tracking/current-session")
async def get_current_project_time_session(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get current active time session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            return {"session": None}
        
        # Find active time entry for current user (has startTime but no endTime)
        active_entry = db.query(DBTimeEntry).filter(
            DBTimeEntry.employeeId == str(employee.id),
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.startTime.isnot(None),
            DBTimeEntry.endTime.is_(None)
        ).first()
        
        if active_entry:
            return {
                "session": {
                    "id": str(active_entry.id),
                    "employeeId": str(active_entry.employeeId),
                    "projectId": str(active_entry.projectId) if active_entry.projectId else None,
                    "taskId": str(active_entry.taskId) if active_entry.taskId else None,
                    "startTime": active_entry.startTime.isoformat() if active_entry.startTime else None,
                    "description": active_entry.description,
                    "isActive": True
                }
            }
        else:
            return {"session": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current session: {str(e)}")

@router.post("/time-tracking/start")
async def start_project_time_session(
    session_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Start a new time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Check if user has an employee record, create one if not
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            # Create employee record for the user
            employee = DBEmployee(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                userId=str(current_user.id),
                employeeId=f"EMP-{current_user.userName.upper()}",
                department="General",
                position=current_user.userRole,
                hireDate=datetime.now().date(),
                isActive=True,
                createdAt=datetime.now(),
                updatedAt=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)
        
        # Check if user already has an active session
        existing_active = db.query(DBTimeEntry).filter(
            DBTimeEntry.employeeId == str(employee.id),
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.startTime.isnot(None),
            DBTimeEntry.endTime.is_(None)
        ).first()
        
        if existing_active:
            raise HTTPException(status_code=400, detail="User already has an active time session")
        
        time_entry_data = {
            "employeeId": str(employee.id),
            "date": datetime.now().date(),
            "startTime": datetime.now(),
            "projectId": session_data.get("projectId"),
            "taskId": session_data.get("taskId"),
            "description": session_data.get("description"),
            "hours": 0.0,
            "tenant_id": tenant_id,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        
        time_entry = create_time_entry(time_entry_data, db)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting time session: {str(e)}")

@router.post("/time-tracking/stop/{session_id}")
async def stop_project_time_session(
    session_id: str,
    stop_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Stop a time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to stop this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        time_entry.endTime = datetime.now()
        
        if time_entry.startTime:
            duration = time_entry.endTime - time_entry.startTime
            time_entry.hours = duration.total_seconds() / 3600
        
        if stop_data.get("notes"):
            time_entry.description = f"{time_entry.description or ''}\n{stop_data['notes']}"
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)
        
        return {"timeEntry": transform_db_time_entry_to_pydantic(time_entry)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error stopping time session: {str(e)}")

@router.post("/time-tracking/pause/{session_id}")
async def pause_project_time_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Pause a time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to pause this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": False
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error pausing time session: {str(e)}")

@router.post("/time-tracking/resume/{session_id}")
async def resume_project_time_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Resume a paused time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to resume this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not paused")
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": True
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resuming time session: {str(e)}")

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str, 
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    try:
        uuid.UUID(str(project_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project_id format. Must be a UUID.")
    
    query = GetProjectByIdQuery(
        project_id=project_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    project_entity = result.value
    if not project_entity:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if hasattr(project_entity, 'id'):
        return transform_project_to_response_from_entity(project_entity, db)
    else:
        return transform_project_to_response(project_entity)

@router.post("", response_model=Project)
async def create_new_project(
    project_data: ProjectCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    if not project_data.projectManagerId or project_data.projectManagerId.strip() == '':
        raise HTTPException(status_code=400, detail="Project manager is required")
    
    project_manager = get_user_by_id(project_data.projectManagerId, db)
    if not project_manager:
        raise HTTPException(status_code=400, detail="Project manager not found")
    
    command = CreateProjectCommand(
        tenant_id=tenant_id or "",
        name=project_data.name,
        description=project_data.description,
        status=project_data.status.value if hasattr(project_data.status, 'value') else str(project_data.status),
        priority=project_data.priority.value if hasattr(project_data.priority, 'value') else str(project_data.priority),
        startDate=project_data.startDate.isoformat() if project_data.startDate and hasattr(project_data.startDate, 'isoformat') else project_data.startDate,
        endDate=project_data.endDate.isoformat() if project_data.endDate and hasattr(project_data.endDate, 'isoformat') else project_data.endDate,
        completionPercent=project_data.completionPercent,
        budget=project_data.budget,
        actualCost=project_data.actualCost or 0.0,
        notes=project_data.notes,
        clientEmail=project_data.clientEmail,
        projectManagerId=project_data.projectManagerId,
        teamMemberIds=project_data.teamMemberIds or []
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    project_entity = result.value
    return transform_project_to_response_from_entity(project_entity, db)

@router.put("/{project_id}", response_model=Project)
async def update_existing_project(
    project_id: str, 
    project_data: ProjectUpdate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update a project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    update_dict = project_data.model_dump(exclude_unset=True)
    
    command = UpdateProjectCommand(
        project_id=project_id,
        tenant_id=tenant_id,
        name=update_dict.get('name'),
        description=update_dict.get('description'),
        status=update_dict['status'].value if 'status' in update_dict and hasattr(update_dict['status'], 'value') else update_dict.get('status'),
        priority=update_dict['priority'].value if 'priority' in update_dict and hasattr(update_dict['priority'], 'value') else update_dict.get('priority'),
        startDate=update_dict['startDate'].isoformat() if 'startDate' in update_dict and hasattr(update_dict.get('startDate'), 'isoformat') else update_dict.get('startDate'),
        endDate=update_dict['endDate'].isoformat() if 'endDate' in update_dict and hasattr(update_dict.get('endDate'), 'isoformat') else update_dict.get('endDate'),
        completionPercent=update_dict.get('completionPercent'),
        budget=update_dict.get('budget'),
        actualCost=update_dict.get('actualCost'),
        notes=update_dict.get('notes'),
        clientEmail=update_dict.get('clientEmail'),
        projectManagerId=update_dict.get('projectManagerId'),
        teamMemberIds=update_dict.get('teamMemberIds')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    project_entity = result.value
    return transform_project_to_response_from_entity(project_entity, db)

@router.delete("/{project_id}")
async def delete_existing_project(
    project_id: str, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteProjectCommand(
        project_id=project_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Project deleted successfully"}

def transform_task_to_response(task: DBTask):
    """Transform database task to response format for project tasks"""
    return Task(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project=str(task.projectId),
        assignedTo={
            "id": str(task.assignedTo.id),
            "name": f"{task.assignedTo.firstName or ''} {task.assignedTo.lastName or ''}".strip() or task.assignedTo.userName,
            "email": task.assignedTo.email
        } if task.assignedTo else None,
        dueDate=task.dueDate,
        estimatedHours=task.estimatedHours,
        actualHours=task.actualHours,
        tags=json.loads(task.tags) if task.tags else [],
        createdBy={
            "id": str(task.createdBy.id),
            "name": f"{task.createdBy.firstName or ''} {task.createdBy.lastName or ''}".strip() or task.createdBy.userName,
            "email": task.createdBy.email
        },
        completedAt=task.completedAt,
        createdAt=task.createdAt,
        updatedAt=task.updatedAt
    )

@router.get("/{project_id}/tasks", response_model=TasksResponse)
async def get_project_tasks(
    project_id: str, 
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all tasks for a specific project"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    project = get_project_by_id(project_id, db, tenant_id=tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = get_tasks_by_project(project_id, db, tenant_id=tenant_id)
    task_list = [transform_task_to_response(task) for task in tasks]
    
    return TasksResponse(
        tasks=task_list,
        pagination={
            "page": 1,
            "limit": len(task_list),
            "total": len(task_list),
            "pages": 1
        }
    )

@router.get("/team-members")
async def get_project_team_members(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all available team members for project assignment"""
    from ...models.unified_models import UserRole
    from ...config.database import get_all_users
    
    # Get all active users who can be team members
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    users = get_all_users(db, tenant_id=tenant_id)
    team_members = []
    
    for user in users:
        if user.isActive and user.userRole in [UserRole.PROJECT_MANAGER.value, UserRole.TEAM_MEMBER.value]:
            team_members.append({
                "id": str(user.id),
                "name": f"{user.firstName or ''} {user.lastName or ''}".strip() or user.userName,
                "email": user.email,
                "role": user.userRole,
                "avatar": user.avatar
            })
    
    return {"teamMembers": team_members}
