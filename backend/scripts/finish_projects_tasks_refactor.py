import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
legacy_projects = (ROOT / "api/v1/projects/_legacy_projects.py").read_text(encoding="utf-8")
legacy_tasks = (ROOT / "api/v1/tasks/_legacy_tasks.py").read_text(encoding="utf-8")

time_start = legacy_projects.find('@router.get("/time-entries"')
team_start = legacy_projects.find('@router.get("/team-members")')
projects_end = time_start

ITEMS_HEADER = '''from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
import json
import uuid
from datetime import datetime, timedelta

from .schemas import Project, ProjectCreate, ProjectUpdate, ProjectsResponse, TasksResponse
from .....models.user_models import TeamMember
from .....config.database import get_db, get_user_by_id, User, TenantUser
from .....models.projects import Project as DBProject, Task as DBTask
from .....api.dependencies import get_current_user, get_tenant_context, require_permission, can_see_all_tasks
from .....models.common import ModulePermission
from . import logic as project_logic
from ...tasks.items import logic as task_logic

router = APIRouter()

'''

TIME_HEADER = '''from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
import json
import uuid
from datetime import datetime, timedelta

from .....models.user_models import TeamMember
from .....models.hrm_models import TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse
from .....config.database import (
    get_db, get_user_by_id, get_task_by_id,
    get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry,
    User,
)
from .....models.projects import Project as DBProject, Task as DBTask
from .....config.hrm_models import TimeEntry as DBTimeEntry, Employee as DBEmployee
from .....api.dependencies import get_current_user, get_tenant_context, require_permission, can_see_all_tasks
from .....models.common import ModulePermission
from .....services.task_time_service import sync_task_actual_hours, check_and_send_task_time_reminder
from ..items import logic as project_logic

router = APIRouter()

'''

TASKS_HEADER = '''from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
from datetime import datetime

from .schemas import TaskCreate, TaskUpdate, TasksResponse, SubTask
from .....config.database import get_db, get_user_by_id
from .....models.projects import Task as DBTask
from .....api.dependencies import get_current_user, get_tenant_context, can_see_all_tasks
from .....services.task_time_service import (
    build_task_time_fields,
    normalize_task_duration_fields,
    process_task_time_reminders_for_tasks,
    sync_task_actual_hours,
    check_and_send_task_time_reminder,
)
from . import logic as task_logic
from ...projects.items import logic as project_logic

router = APIRouter()

'''

TRANSFORMS = legacy_projects[
    legacy_projects.find("def transform_user_to_team_member"):
    legacy_projects.find('@router.get("", response_model=ProjectsResponse)')
]

CRUD_REPLACEMENTS = [
    (r"\bcreate_project\(", "project_logic.create_project("),
    (r"\bget_project_by_id\(", "project_logic.get_project_by_id("),
    (r"\bupdate_project\(", "project_logic.update_project("),
    (r"\bdelete_project\(", "project_logic.delete_project("),
    (r"\bget_project_ids_with_tasks_assigned_to\(", "project_logic.get_project_ids_with_tasks_assigned_to("),
    (r"\bget_tasks_by_project\(", "task_logic.get_tasks_by_project("),
    (r"\bcreate_task\(", "task_logic.create_task("),
    (r"\bget_task_by_id\(", "task_logic.get_task_by_id("),
    (r"\bupdate_task\(", "task_logic.update_task("),
    (r"\bdelete_task\(", "task_logic.delete_task("),
    (r"\bget_all_tasks\(", "task_logic.get_all_tasks("),
    (r"\bget_main_tasks_by_project\(", "task_logic.get_main_tasks_by_project("),
    (r"\bget_subtasks_by_parent\(", "task_logic.get_subtasks_by_parent("),
    (r"\bget_task_with_subtasks\(", "task_logic.get_task_with_subtasks("),
]


def apply_crud_replacements(content: str) -> str:
    for pattern, repl in CRUD_REPLACEMENTS:
        content = re.sub(
            rf"(?<!\.)project_logic\.{repl.lstrip('project_logic.')}" if repl.startswith("project_logic") else None,
            repl,
            content,
        ) if False else content
    for pattern, repl in CRUD_REPLACEMENTS:
        content = re.sub(pattern, repl, content)
    content = content.replace("project_logic.project_logic.", "project_logic.")
    content = content.replace("task_logic.task_logic.", "task_logic.")
    return content


def fix_imports(content: str) -> str:
    content = content.replace("from ...models.", "from .....models.")
    content = content.replace("from ...config.", "from .....config.")
    content = content.replace("from ...api.", "from .....api.")
    content = content.replace("from ...services.", "from .....services.")
    content = content.replace("from .....config.database import TenantUser\n", "")
    content = content.replace(
        "from .....config.database import TenantUser",
        "",
    )
    return content


projects_body = legacy_projects[
    legacy_projects.find('@router.get("", response_model=ProjectsResponse)'):projects_end
]
projects_body += legacy_projects[team_start:]
projects_items_api = ITEMS_HEADER + TRANSFORMS + apply_crud_replacements(fix_imports(projects_body))

time_body = legacy_projects[time_start:team_start]
time_api = TIME_HEADER + TRANSFORMS + apply_crud_replacements(fix_imports(time_body))

tasks_body = legacy_tasks[legacy_tasks.find("def transform_subtask_to_response"):]
tasks_api = TASKS_HEADER + apply_crud_replacements(fix_imports(tasks_body))

(ROOT / "api/v1/projects/items/api.py").write_text(projects_items_api, encoding="utf-8")
(ROOT / "api/v1/projects/time_tracking/api.py").write_text(time_api, encoding="utf-8")
(ROOT / "api/v1/tasks/items/api.py").write_text(tasks_api, encoding="utf-8")

(ROOT / "api/v1/projects/__init__.py").write_text(
    '''from fastapi import APIRouter

from .items.api import router as items_router
from .time_tracking.api import router as time_tracking_router

router = APIRouter(prefix="/projects", tags=["projects"])
router.include_router(items_router)
router.include_router(time_tracking_router)
''',
    encoding="utf-8",
)

(ROOT / "api/v1/tasks/__init__.py").write_text(
    '''from fastapi import APIRouter

from .items.api import router as items_router

router = APIRouter(prefix="/tasks", tags=["tasks"])
router.include_router(items_router)
''',
    encoding="utf-8",
)

(ROOT / "config/project_models.py").write_text(
    '''from ..models.projects import (
    Project,
    Task,
    ProjectStatus,
    ProjectPriority,
    TaskStatus,
    TaskPriority,
)

__all__ = [
    "Project",
    "Task",
    "ProjectStatus",
    "ProjectPriority",
    "TaskStatus",
    "TaskPriority",
]
''',
    encoding="utf-8",
)

(ROOT / "config/project_crud.py").write_text(
    '''from ..api.v1.projects.items.logic import (
    get_project_by_id,
    get_all_projects,
    get_projects_by_manager,
    get_project_ids_with_tasks_assigned_to,
    create_project,
    update_project,
    delete_project,
    get_project_stats,
)
from ..api.v1.tasks.items.logic import (
    get_task_by_id,
    get_all_tasks,
    get_tasks_by_project,
    get_subtasks_by_parent,
    get_main_tasks_by_project,
    get_task_with_subtasks,
    get_tasks_by_assignee,
    get_tasks_by_creator,
    create_task,
    update_task,
    delete_task,
    get_task_stats,
)

__all__ = [
    "get_project_by_id",
    "get_all_projects",
    "get_projects_by_manager",
    "get_project_ids_with_tasks_assigned_to",
    "create_project",
    "update_project",
    "delete_project",
    "get_project_stats",
    "get_task_by_id",
    "get_all_tasks",
    "get_tasks_by_project",
    "get_subtasks_by_parent",
    "get_main_tasks_by_project",
    "get_task_with_subtasks",
    "get_tasks_by_assignee",
    "get_tasks_by_creator",
    "create_task",
    "update_task",
    "delete_task",
    "get_task_stats",
]
''',
    encoding="utf-8",
)

print("refactor files written")
