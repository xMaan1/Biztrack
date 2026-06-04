import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

legacy_projects = (ROOT / "api/v1/projects/_legacy_projects.py").read_text(encoding="utf-8")
legacy_tasks = (ROOT / "api/v1/tasks/_legacy_tasks.py").read_text(encoding="utf-8")

time_start = legacy_projects.find('@router.get("/time-entries"')
team_start = legacy_projects.find('@router.get("/team-members")')
project_detail = legacy_projects.find('@router.get("/{project_id}", response_model=Project)')

projects_section = (
    legacy_projects[legacy_projects.find("def transform_user_to_team_member"):time_start]
    + legacy_projects[team_start:project_detail]
    + legacy_projects[legacy_projects.find('@router.get("/{project_id}/tasks"'):]
)
time_section = legacy_projects[time_start:team_start]
tasks_section = legacy_tasks[legacy_tasks.find("def transform_subtask_to_response"):]


def strip_router_decorators(text: str) -> str:
    text = re.sub(r"^@router\.(?:get|post|put|delete)\([^\)]*\)\s*\n", "", text, flags=re.M)
    text = re.sub(r"^@router\.\w+\([^\)]*\)\s*\n", "", text, flags=re.M)
    return text


PROJECT_IMPORTS = """import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from .....config.database import get_db, get_user_by_id, User, get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry
from .....models.projects import Project as DBProject, Task as DBTask
from .....config.hrm_models import TimeEntry as DBTimeEntry, Employee as DBEmployee
from .....api.dependencies import get_current_user, get_tenant_context, require_permission, can_see_all_tasks
from .....models.common import ModulePermission
from .....models.user_models import TeamMember
from .....models.hrm_models import TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse
from .....services.task_time_service import sync_task_actual_hours, check_and_send_task_time_reminder
from ..items.schemas import Project, ProjectCreate, ProjectUpdate, ProjectsResponse, Task, TasksResponse
from ..items import logic as project_logic

"""

TASK_IMPORTS = """import json
from datetime import datetime
from typing import Optional, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import get_db, get_user_by_id
from .....models.projects import Task as DBTask
from .....api.dependencies import get_current_user, get_tenant_context, can_see_all_tasks
from .....services.task_time_service import (
    build_task_time_fields,
    normalize_task_duration_fields,
    process_task_time_reminders_for_tasks,
)
from .schemas import TaskCreate, TaskUpdate, TasksResponse, SubTask
from . import logic as task_logic

"""


def alias_crud(text: str, prefix: str) -> str:
    for name in [
        "get_project_by_id",
        "get_all_projects",
        "create_project",
        "update_project",
        "delete_project",
        "get_project_ids_with_tasks_assigned_to",
        "get_tasks_by_project",
        "get_task_by_id",
        "get_all_tasks",
        "get_main_tasks_by_project",
        "get_subtasks_by_parent",
        "get_task_with_subtasks",
        "create_task",
        "update_task",
        "delete_task",
    ]:
        text = re.sub(rf"(?<![\w\.]){name}\(", f"{prefix}.{name}(", text)
    return text


(ROOT / "api/v1/projects/items/logic_handlers.py").write_text(
    alias_crud(PROJECT_IMPORTS + strip_router_decorators(projects_section), "project_logic"),
    encoding="utf-8",
)
(ROOT / "api/v1/projects/time_tracking/logic.py").write_text(
    alias_crud(PROJECT_IMPORTS + strip_router_decorators(time_section), "project_logic"),
    encoding="utf-8",
)
(ROOT / "api/v1/tasks/items/logic_handlers.py").write_text(
    alias_crud(TASK_IMPORTS + strip_router_decorators(tasks_section), "task_logic"),
    encoding="utf-8",
)

print("done")
