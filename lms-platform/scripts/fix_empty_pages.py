from pathlib import Path
from typing import List

paths: List[str] = [
    'frontend/src/app/(auth)/forgot-password/page.tsx',
    'frontend/src/app/(dashboard)/admin/departments/page.tsx',
    'frontend/src/app/(dashboard)/admin/reports/page.tsx',
    'frontend/src/app/(dashboard)/admin/courses/create/page.tsx',
    'frontend/src/app/(dashboard)/admin/users/[id]/page.tsx',
    'frontend/src/app/(dashboard)/student/grades/page.tsx',
    'frontend/src/app/(dashboard)/student/assignments/[assignmentId]/page.tsx',
    'frontend/src/app/(dashboard)/student/my-courses/[courseId]/page.tsx',
    'frontend/src/app/(dashboard)/student/my-courses/[courseId]/lectures/page.tsx',
    'frontend/src/app/(dashboard)/student/my-courses/[courseId]/materials/page.tsx',
    'frontend/src/app/(dashboard)/student/my-courses/[courseId]/progress/page.tsx',
    'frontend/src/app/(dashboard)/teacher/assignments/page.tsx',
    'frontend/src/app/(dashboard)/teacher/attendance/page.tsx',
    'frontend/src/app/(dashboard)/teacher/gradebook/page.tsx',
    'frontend/src/app/(dashboard)/teacher/assignments/[assignmentId]/submissions/page.tsx',
    'frontend/src/app/(dashboard)/teacher/attendance/qr/page.tsx',
    'frontend/src/app/(dashboard)/teacher/courses/[courseId]/page.tsx',
    'frontend/src/app/(dashboard)/teacher/courses/[courseId]/assignments/page.tsx',
    'frontend/src/app/(dashboard)/teacher/courses/[courseId]/attendance/page.tsx',
    'frontend/src/app/(dashboard)/teacher/courses/[courseId]/lectures/page.tsx',
    'frontend/src/app/(dashboard)/teacher/courses/[courseId]/students/page.tsx',
]

template = '''export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-sm text-gray-500">Page content coming soon.</p>
    </div>
  )
}
'''

for rel in paths:
    p = Path(rel)
    if p.exists():
        txt = p.read_text(encoding='utf-8', errors='ignore')
        if not txt.strip() or 'export default' not in txt:
            p.write_text(template, encoding='utf-8')
            print(f'patched: {p}')
    else:
        print(f'missing: {p}')
