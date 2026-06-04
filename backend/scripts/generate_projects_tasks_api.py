import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
legacy_projects = (ROOT / "api/v1/projects/_legacy_projects.py").read_text(encoding="utf-8")
legacy_tasks = (ROOT / "api/v1/tasks/_legacy_tasks.py").read_text(encoding="utf-8")

time_start = legacy_projects.find('@router.get("/time-entries"')
team_start = legacy_projects.find('@router.get("/team-members")')
project_detail = legacy_projects.find('@router.get("/{project_id}", response_model=Project)')

projects_api = legacy_projects[: legacy_projects.find("router = APIRouter")]
projects_api += "router = APIRouter()\n\n"
projects_api += legacy_projects[
    legacy_projects.find("@router.get(\"\", response_model=ProjectsResponse)"):time_start
]
projects_api += legacy_projects[team_start:]

time_api = legacy_projects[: legacy_projects.find("router = APIRouter")]
time_api += "router = APIRouter()\n\n"
time_api += legacy_projects[time_start:team_start]

tasks_api = legacy_tasks

IMPORT_REPLACEMENTS = [
    ("from ...models.project_models import", "from .schemas import"),
    ("from ...models.hrm_models import", "from .....models.hrm_models import"),
    ("from ...models.user_models import", "from .....models.user_models import"),
    ("from ...config.database import", "from .....config.database import"),
    ("from ...config.hrm_models import", "from .....config.hrm_models import"),
    ("from ...api.dependencies import", "from .....api.dependencies import"),
    ("from ...models.common import", "from .....models.common import"),
    ("from ...services.task_time_service import", "from .....services.task_time_service import"),
    ("from ...services.notification_service import", "from .....services.notification_service import"),
    ("from ...config.notification_models import", "from .....config.notification_models import"),
    ("from ...config.database import TenantUser", "from .....config.database import TenantUser"),
]

CRUD_TO_LOGIC = [
    ("create_project(", "project_logic.create_project("),
    ("get_project_by_id(", "project_logic.get_project_by_id("),
    ("update_project(", "project_logic.update_project("),
    ("delete_project(", "project_logic.delete_project("),
    ("get_project_ids_with_tasks_assigned_to(", "project_logic.get_project_ids_with_tasks_assigned_to("),
    ("get_tasks_by_project(", "project_logic.get_tasks_by_project("),
    ("create_task(", "task_logic.create_task("),
    ("get_task_by_id(", "task_logic.get_task_by_id("),
    ("update_task(", "task_logic.update_task("),
    ("delete_task(", "task_logic.delete_task("),
    ("get_all_tasks(", "task_logic.get_all_tasks("),
    ("get_main_tasks_by_project(", "task_logic.get_main_tasks_by_project("),
    ("get_subtasks_by_parent(", "task_logic.get_subtasks_by_parent("),
    ("get_task_with_subtasks(", "task_logic.get_task_with_subtasks("),
]


def fix_api(content: str, schemas_from: str, logic_import: str) -> str:
    for a, b in IMPORT_REPLACEMENTS:
        content = content.replace(a, b)
    content = content.replace(
        "from .schemas import (\n    Project, ProjectCreate, ProjectUpdate, ProjectsResponse, TasksResponse, Task\n)",
        f"from {schemas_from} import Project, ProjectCreate, ProjectUpdate, ProjectsResponse, TasksResponse, Task",
    )
    if "from .schemas import TaskCreate" not in content:
        content = content.replace(
            "from .....config.database import get_db",
            f"from .....config.database import get_db\n{logic_import}",
        )
    for a, b in CRUD_TO_LOGIC:
        content = content.replace(a, b)
    content = content.replace("Project as DBProject, Task as DBTask", "Project as DBProject, Task as DBTask")
    content = content.replace(
        "from .....models.projects import Project as DBProject, Task as DBTask",
        "from .....models.projects import Project as DBProject, Task as DBTask",
    )
    return content


projects_api = fix_api(
    projects_api,
    ".schemas",
    "from . import logic as project_logic\nfrom ..time_tracking import logic as time_logic",
)
projects_api = projects_api.replace("project_logic.get_time_entries", "get_time_entries")
projects_api = projects_api.replace("project_logic.get_time_entry_by_id", "get_time_entry_by_id")
projects_api = projects_api.replace("project_logic.create_time_entry", "create_time_entry")
projects_api = projects_api.replace("project_logic.update_time_entry", "update_time_entry")
projects_api = projects_api.replace("project_logic.delete_time_entry", "delete_time_entry")

time_api = fix_api(
    time_api,
    "..items.schemas",
    "from ..items import logic as project_logic",
)

tasks_api = fix_api(
    tasks_api,
    ".schemas",
    "from . import logic as task_logic\nfrom ..projects.items import logic as project_logic",
)

(ROOT / "api/v1/projects/items/api.py").write_text(projects_api, encoding="utf-8")
(ROOT / "api/v1/projects/time_tracking/api.py").write_text(time_api, encoding="utf-8")
(ROOT / "api/v1/tasks/items/api.py").write_text(tasks_api, encoding="utf-8")
print("api files written")
