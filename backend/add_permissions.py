import re
import os
from pathlib import Path

api_files = {
    'sales.py': 'SALES',
    'inventory.py': 'INVENTORY',
    'projects.py': 'PROJECTS',
    'hrm.py': 'HRM',
    'production.py': 'PRODUCTION',
    'quality_control.py': 'QUALITY',
    'maintenance.py': 'MAINTENANCE',
    'banking.py': 'FINANCE',
    'ledger.py': 'FINANCE',
    'pos.py': 'INVENTORY',
    'tasks.py': 'PROJECTS',
    'work_orders.py': 'PROJECTS',
    'events.py': 'EVENTS',
    'reports.py': 'REPORTS',
}

def add_permissions_to_file(file_path, module_prefix):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    view_perm = f"ModulePermission.{module_prefix}_VIEW.value"
    create_perm = f"ModulePermission.{module_prefix}_CREATE.value"
    update_perm = f"ModulePermission.{module_prefix}_UPDATE.value"
    delete_perm = f"ModulePermission.{module_prefix}_DELETE.value"
    
    patterns = [
        (r'(@router\.get\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({view_perm}))\n):'),
        (r'(@router\.post\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({create_perm}))\n):'),
        (r'(@router\.put\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({update_perm}))\n):'),
        (r'(@router\.delete\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({delete_perm}))\n):'),
        (r'(@router\.get\([^)]+\)\s+async def \w+\([^)]*current_user[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({view_perm}))\n):'),
        (r'(@router\.post\([^)]+\)\s+async def \w+\([^)]*current_user[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({create_perm}))\n):'),
        (r'(@router\.put\([^)]+\)\s+async def \w+\([^)]*current_user[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({update_perm}))\n):'),
        (r'(@router\.delete\([^)]+\)\s+async def \w+\([^)]*current_user[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({delete_perm}))\n):'),
        (r'(@router\.get\([^)]+\)\s+async def \w+\([^)]*db[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({view_perm}))\n):'),
        (r'(@router\.post\([^)]+\)\s+async def \w+\([^)]*db[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({create_perm}))\n):'),
        (r'(@router\.put\([^)]+\)\s+async def \w+\([^)]*db[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({update_perm}))\n):'),
        (r'(@router\.delete\([^)]+\)\s+async def \w+\([^)]*db[^)]*tenant_context[^)]*)\):', 
         f'\\1,\n    _: dict = Depends(require_permission({delete_perm}))\n):'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
        return True
    return False

api_dir = Path('src/api/v1')

for filename, module in api_files.items():
    file_path = api_dir / filename
    if file_path.exists():
        add_permissions_to_file(file_path, module)

print("Done!")

