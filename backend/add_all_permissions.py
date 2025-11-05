import re
import os
from pathlib import Path

api_files = {
    'sales.py': ('SALES', 'from ...api.dependencies import get_current_user, get_tenant_context, require_tenant_admin_or_super_admin, require_permission\nfrom ...models.unified_models import ModulePermission'),
    'inventory.py': ('INVENTORY', 'from ..dependencies import get_current_user, get_tenant_context, require_permission\nfrom ...models.unified_models import ModulePermission'),
    'projects.py': ('PROJECTS', None),
    'hrm.py': ('HRM', None),
    'production.py': ('PRODUCTION', None),
    'quality_control.py': ('QUALITY', None),
    'maintenance.py': ('MAINTENANCE', None),
    'banking.py': ('FINANCE', None),
    'ledger.py': ('FINANCE', None),
    'pos.py': ('INVENTORY', None),
    'tasks.py': ('PROJECTS', None),
    'work_orders.py': ('PROJECTS', None),
    'events.py': ('EVENTS', None),
    'reports.py': ('REPORTS', None),
}

def find_import_line(content, pattern):
    for i, line in enumerate(content.split('\n')):
        if pattern in line:
            return i
    return -1

def add_imports_if_needed(file_path, import_statement):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    content = ''.join(lines)
    
    if 'require_permission' not in content or 'ModulePermission' not in content:
        if import_statement:
            deps_line_idx = -1
            for i, line in enumerate(lines):
                if 'from ...api.dependencies import' in line or 'from ..dependencies import' in line:
                    deps_line_idx = i
                    break
            
            if deps_line_idx >= 0:
                if 'require_permission' not in lines[deps_line_idx]:
                    lines[deps_line_idx] = lines[deps_line_idx].rstrip() + ', require_permission\n'
            else:
                model_line_idx = -1
                for i, line in enumerate(lines):
                    if 'from ...models' in line or 'from ..models' in line:
                        model_line_idx = i
                        break
                
                insert_idx = model_line_idx + 1 if model_line_idx >= 0 else 10
                lines.insert(insert_idx, import_statement + '\n')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

def add_permissions_to_endpoints(content, module_prefix):
    view_perm = f"ModulePermission.{module_prefix}_VIEW.value"
    create_perm = f"ModulePermission.{module_prefix}_CREATE.value"
    update_perm = f"ModulePermission.{module_prefix}_UPDATE.value"
    delete_perm = f"ModulePermission.{module_prefix}_DELETE.value"
    
    def add_perm_to_endpoint(match, perm_type):
        full_match = match.group(0)
        if 'require_permission' in full_match:
            return full_match
        
        perm_map = {
            'GET': view_perm,
            'POST': create_perm,
            'PUT': update_perm,
            'DELETE': delete_perm,
        }
        
        perm = perm_map.get(perm_type, view_perm)
        
        if full_match.endswith('):'):
            return full_match[:-2] + f',\n    _: dict = Depends(require_permission({perm}))\n):'
        return full_match
    
    patterns = [
        (r'(@router\.get\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 'GET'),
        (r'(@router\.post\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 'POST'),
        (r'(@router\.put\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 'PUT'),
        (r'(@router\.delete\([^)]+\)\s+async def \w+\([^)]*tenant_context[^)]*)\):', 'DELETE'),
    ]
    
    for pattern, perm_type in patterns:
        def replacer(match):
            return add_perm_to_endpoint(match, perm_type)
        content = re.sub(pattern, replacer, content, flags=re.MULTILINE)
    
    return content

api_dir = Path('src/api/v1')

for filename, (module, import_stmt) in api_files.items():
    file_path = api_dir / filename
    if file_path.exists():
        print(f"Processing {filename}...")
        
        add_imports_if_needed(file_path, import_stmt)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        content = add_permissions_to_endpoints(content, module)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  Updated {filename}")
        else:
            print(f"  No changes needed for {filename}")

print("\nDone!")

