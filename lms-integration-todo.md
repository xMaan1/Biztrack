# LMS Integration into BizTrack — Full Task Checklist

> Goal: 100% migrate the LMS (`lms-platform/`, MySQL, own auth/DB/frontend) into BizTrack as a first-class module — exactly like Healthcare. **BizTrack's structures win everywhere**: UUID PKs, `tenant_id` FK, SQLAlchemy models in `backend/src/models/lms/`, `api/v1/lms/<domain>/{api,logic,schemas}.py` layout, Alembic on PostgreSQL, one auth/session, one tenant model, frontend under `frontend/src/app/lms/` following the healthcare pages style.
>
> **How to use:** mark each box `- [x]` as you finish. Keep this file updated and committed with the work.

## Phase 0 — Baseline & Decisions (locked to BizTrack conventions)
- [x] Document the locked conventions below (UUID PKs, tenant scoping, single user system, plan/RBAC registration) in this file
- [x] Create working branch `feat/lms-integration` from latest `main`
- [x] Confirm BizTrack backend + frontend run locally (baseline smoke test)
- [x] Note current Alembic head revision — **`p6q7r8s9t0u1`** (`alembic heads`)
- [x] Note current `main.py` include_router block and `plans_registry.py` `lms` plan status
- [x] Snapshot of `lms-platform/backend/schema.sql` + `seed.sql` → saved to `backend/scripts/lms_reference/` (schema will be rebuilt BizTrack-style)
- [x] **IDs**: use BizTrack string/UUID PKs for ALL new LMS tables — NO LMS int IDs
- [x] **Tenancy**: every LMS table gets `tenant_id` UUID FK → `tenants.id` (like healthcare)
- [x] **Users**: NO separate LMS user/role tables — reuse BizTrack `users`/RBAC; LMS roles become permissions
- [x] **Columns**: follow healthcare naming (`camelCase` createdAt/updatedAt, `is_active`, snake_case rest)
- [x] **Storage**: **S3** for all uploads (course videos, materials, submissions, face images)
- [x] **Face recognition**: host on the **production server** (Ubuntu dep install; add feature-flag fallback)
- [x] **Public pages**: **keep public what should be public** — apply forms (student/teacher/success) stay publicly reachable; **LMS marketing landing page (fake-data mock) is NOT ported** (BizTrack has its own landing); reconcile apply routes with `tenantPublicRoutes` so `/lms/apply/*` bypasses login; corresponding backend endpoints must work unauthenticated

### Locked conventions (record of decisions)
- **Module layout**: `backend/src/models/lms/` (SQLAlchemy models), `backend/src/api/v1/lms/<domain>/{api,logic,schemas}.py`, `backend/src/main.py` registers one `lms.router` (prefix `/lms`, tags `lms`)
- **Identity**: UUID PKs (`uuid.uuid4`), `tenant_id` UUID FK → `tenants.id` on every row table
- **Users**: no LMS user/role tables — use BizTrack `users` + RBAC; LMS actor types (teacher/student) = permissions/memberships, `lms_profile` only for truly LMS-specific fields
- **Permissions**: `lms:view/create/update/delete` + submodule codes (courses, lectures, assignments, grades, attendance, enrollments, live sessions, applications, reports)
- **Plan**: `lms` plan already in `backend/src/core/plans_registry.py` (LMS Suite, $39/mo) + `LandingPlanModulesSection.tsx` — verify consistency in Phase 8
- **DB**: PostgreSQL only; Alembic migrations; `migration_utils` helpers used in migrations
- **Auth**: single BizTrack session/JWT for protected areas; delete all LMS mock-auth (`MOCK_USERS`, `mock_token_`); **public LMS routes** (apply forms only) stay public — reachable without login and wired via `tenantPublicRoutes`, with matching unauthenticated backend endpoints (e.g. submit application); the LMS marketing landing page is NOT ported
- **Smoke test**: backend `src.main` imports OK; frontend `tsc --noemit` clean on `main` (baseline)

## Phase 1 — Backend: SQLAlchemy Models + Alembic (BizTrack-style)
- [x] Create `backend/src/models/lms/` package (healthcare layout) with a shared `Base`
- [x] Model `department` (UUID id, tenant_id, name, camelCase timestamps)
- [x] Model `course` (+ cover image, price?, status)
- [x] Model `lecture`, `material`, `quiz`, `review`, `progress`
- [x] Model `enrollment` (course × user, status)
- [ ] Model `assignment`, `submission`, `grade`
- [ ] Model `attendance`, `face_encoding`
- [ ] Model `live_session`
- [ ] Model `notification`
- [ ] Model `application` / `application_document` / `application_status_log` (student & teacher applications)
- [ ] Model `course_deletion_request`, `audit_log`
- [ ] **Drop** LMS `user`, `role`, `student`, `teacher`, `admin`, `profile` tables → replaced by BizTrack `users` + RBAC link tables (add a `lms_profile` only if LMS-specific fields are truly needed)
- [ ] Every table: `id = Column(UUID, primary_key=True, default=uuid.uuid4)`, `tenant_id = FK("tenants.id", ondelete="CASCADE")`
- [ ] Define relationships mirroring healthcare FK style
- [ ] Register models so Alembic autogenerate sees them
- [ ] Generate Alembic migration `add_lms_core_tables` (bulk create)
- [ ] Generate Alembic migration `add_lms_indexes`
- [ ] Port seed data (roles→permissions, sample courses) via BizTrack seed path (tenant-aware)
- [ ] Verify `alembic upgrade head` runs clean on PostgreSQL
- [ ] Verify `backend/src/main.py` imports models without side effects

## Phase 2 — Backend: Auth, Tenancy, RBAC (BizTrack-native)
- [ ] Implement LMS endpoints with BizTrack `get_current_user` dependency + tenant context (NO new auth system)
- [ ] Map LMS capabilities onto BizTrack permission codes: `lms:view/create/update/delete` + submodule codes
- [ ] Promote LMS-specific actor types (teacher/student) via custom roles / membership, not new tables
- [ ] Add `PLAN_TYPE_LMS` to `constants/planTypes.ts`, `models/sales/index.ts`, `models/crm/index.ts`
- [ ] Add LMS module + submodules to `frontend/src/constants/rbacPermissions.ts`: `crud('lms')` for courses, lectures, assignments, grades, attendance, enrollments, live sessions, applications, reports

## Phase 3 — Backend: API Routers (healthcare layout)
- [ ] Create `backend/src/api/v1/lms/` following healthcare pattern exactly: `__init__.py` aggregates sub-routers with `prefix="/lms"`, `tags=["lms"]`
- [ ] Create `lms/<domain>/api.py`, `<domain>/logic.py`, `<domain>/schemas.py` per domain
- [ ] Reuse `api/v1/repository.py` (`get_by_id`, `create_entity`, `delete_by_id`) and add lms helper if needed
- [ ] Reuse `logic_common.py` (`paginated_list`, `create_payload`, `update_record`)
- [ ] Domains: departments, courses, lectures, materials, quizzes, enrollments, assignments, submissions, grades, attendance, face-recognition, live-sessions, notifications, reports, applications
- [ ] Profile endpoints: read from BizTrack user + `lms_profile` (role/type determined by permission/membership)
- [ ] Port file-upload handlers for lectures/materials/submissions (BizTrack `file_upload.py` conventions)
- [ ] Port WebSocket notification/session manager (`/ws/lms/*`) into FastAPI
- [ ] Port email-sender, video-processor (ffmpeg), QR-generator utilities
- [ ] Keep frontend-expected response field names (camelCase)
- [ ] Tenant-scope every list/create/update/delete query (`filter(Model.tenant_id == tenant_id)`)
- [ ] Register `app.include_router(lms.router)` in `backend/src/main.py`
- [ ] Verify all LMS endpoints respond via BizTrack auth in `/docs`

## Phase 4 — Frontend: Port Pages into `frontend/src/app/lms/` (healthcare pages style)
- [ ] Create `frontend/src/models/lms/` types — **string/UUID IDs** (refactor away from numeric `id`)
- [ ] Create `frontend/src/services/LmsService.ts` (Queries/Commands pattern, through BizTrack `ApiService`)
- [ ] Delete LMS standalone API layer: `lib/api/client.ts`, `interceptors.ts`, `endpoints.ts`, `AuthContext.tsx`, `useAuth`
- [ ] Remove all LMS mock-auth (`MOCK_USERS`, `mock_token_`) paths
- [ ] Port `(public)` routes: **apply/student, apply/teacher, apply/success only** — keep publicly reachable; skip the marketing landing page (fake-data mock)
- [ ] Port `(auth)` routes: login / register / forgot-password → adapt to BizTrack session (drop register if internal-only)
- [ ] Port dashboard layouts + route groups: admin, teacher, student, public-user, help, notifications, profile
- [ ] Port admin pages (users, courses, departments, applications, reports, settings, students, teachers, admins)
- [ ] Port teacher pages (dashboard, courses, assignments, gradebook, attendance, lectures, live-lecture)
- [ ] Port student pages (dashboard, courses, my-courses, assignments, grades, attendance, live-sessions, live-lecture)
- [ ] Port public-user pages (applications)
- [ ] Port shared components (layout/nav, MobileSidebarModal, WorkOrderDetailSheet)
- [ ] Port hooks: `useLiveSessions`, `useWebRTC`, `useNotificationSocket`, `useNotifications`, `useGrades`, `useLectures`, `useStudents`, `useTeachers`
- [ ] Adapt hooks/pages to BizTrack session + role-from-permission (not LMS `useAuth`)
- [ ] Remove `/lms/:path*` rewrite from `frontend/next.config.js`
- [ ] Add LMS **public** routes (**apply forms only**: `/lms/apply/*`) to `frontend/src/middleware.ts` publicRoutes + `tenantPublicRoutes` so they work without login; keep the rest auth-protected
- [ ] Add LMS section to `frontend/src/constants/sidebarMenuItems.ts` (`planTypes: ['lms']`)
- [ ] Handle LMS in `frontend/src/hooks/useSidebar.ts` (visibility + special cases)
- [ ] Backend: mark public LMS endpoints (e.g. submit application) as unauthenticated / no-tenant
- [ ] Add any public LMS routes to `tenantPublicRoutes` if required
- [ ] Verify every `app/lms/**` page typechecks and renders

## Phase 5 — Data Migration (only if real MySQL data exists)
- [ ] Export MySQL LMS data (frozen dump)
- [ ] Write one-time migration script: MySQL → PostgreSQL BizTrack-style (regenerate UUIDs, remap users to BizTrack `userId`, assign tenant)
- [ ] Run against a copy; validate row counts + spot checks on key tables
- [ ] Archive the script in `backend/scripts/` (documented, one-time)

## Phase 6 — Deployment & Repo Cleanup
- [ ] Remove `lms-backend` / `lms-frontend` from `ecosystem.config.js`
- [ ] Remove `deploy-lms` job and LMS health check from `.github/workflows/deploy.yml` (keep lms path filter as frontend/backend trigger)
- [ ] Remove `/lms-api` upstream + location from `scripts/setup-server.sh`
- [ ] Revert `scripts/deploy.sh` LMS blocks
- [ ] Revert `start-all.ps1` / `start-all.bat` to BizTrack-only (drop LMS processes, MySQL auto-start)
- [ ] Separate unrelated PR baggage (mobile workshop screens, scratch `backend/a.txt`, misc)
- [ ] Delete `lms-platform/` directory from repo
- [ ] Confirm `git grep` shows no remaining lms-platform references in deploy files

## Phase 7 — Tests & Hardening (BizTrack pytest + Postgres)
- [ ] Port LMS tests (auth, courses, assignments, attendance, users) to BizTrack pytest
- [ ] Tenant isolation test (tenant A cannot read tenant B LMS data)
- [ ] Role/permission matrix test (admin vs teacher vs student visibility)
- [ ] RBAC: confirm LMS shows in role editor with the new permission codes
- [ ] WebSocket + WebRTC smoke tests
- [ ] Face-recognition smoke test (or confirm graceful-disable path)
- [ ] Frontend: full render pass over every `app/lms` route against live API
- [ ] Run backend compile/import check + `npx tsc --noemit` + lint + prettier on changed files
- [ ] E2E happy path: sign in → open LMS module → create course → enroll → grade

## Phase 8 — Landing / Plans / Release
- [ ] Confirm `backend/src/core/plans_registry.py` `lms` plan is correct (price/features)
- [ ] Confirm landing module card (`LandingPlanModulesSection.tsx`) shows LMS
- [ ] Confirm landing pricing section lists LMS plan
- [ ] Update `commands.md` / docs with final "how to run" (single stack)
- [ ] Update README/structure notes: remove LMS separate-launch instructions
- [ ] Final review of the diff; squash or organize commits by phase
- [ ] Merge to `main` and deploy (verify all PM2 services healthy)