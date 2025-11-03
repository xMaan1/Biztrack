# Backend Architecture Migration Plan
## From Current Structure to Clean Architecture + CQRS

---

## Current State Analysis

### Existing Structure:
- **32 API route files** in `src/api/v1/`
- **24 CRUD files** in `src/config/*_crud.py`
- **15+ model files** in `src/config/*_models.py`
- **Core utilities** in `src/core/` (auth, acesso, middleware, error handling)
- **Services** in `src/services/` (8 service files)
- **Pydantic models** in `src/models/`

### Target Structure (from backend-structure.md):
- Clean Architecture with CQRS pattern
- 5 layers: Core → Domain → Infrastructure → Application → Presentation
- CQRS pattern: Commands (write) and Queries (read) separated
- Repository pattern with Unit of Work
- Dependency Injection container

---

## Migration Phases

### **PHASE 1: Core Infrastructure Layer** ⏱️ ~3-4 hours
**Goal:** Build CQRS foundation

#### Tasks:
1. Create `src/core/` CQRS infrastructure:
   - `command.py` - Base command classes
   - `query.py` - Base query classes
   - `request_interface.py` - Request interfaces
   - `request_handler.py` - Request handler base classes
   - `handler_interface.py` - Handler interfaces
   - `mediator.py` - Mediator pattern implementation
   - `result.py` - Result wrapper classes
   - `paged_query.py` - Paginated query base classes
   - `paged_result.py` - Paginated result classes
   - `searchable_query.py` - Searchable query base classes
   - `event_interface.py`Sometimes - Event interfaces
   - `event_handler.py` - Event handling infrastructure
   - `di_container.py` - Dependency injection container

2. Preserve existing core utilities:
   - Keep `src/core/auth.py`, `security.py`, `tenant_middleware.py`
   - Keep `src/core/error_handling.py`, `audit.py`, `monitoring.py`
   - Keep `src/core/cache.py`, `currency.py`

---

### **PHASE 2: Domain Layer** ⏱️ ~2-3 hours
**Goal:** Extract business entities and enums

#### Tasks:
1. Create `src/domain/entities/`:
   - `entity.py` - Base entity class
   - Move SQLAlchemy models from `src/config/*_models.py` to domain entities
   - Group by domain: `user_entity.py`, `project_entity.py`, `crm_entity.py`, etc.

2. Create `src/domain/enums/`:
   - Extract enums from models (ProjectStatus, TaskPriority, etc.)
   - Create enum files: `project_enums.py`, `crm_enums.py`, etc.

3. **Models to migrate** (~15 model files):
   - `core_models.py` → `user_entity.py`, `tenant_entity.py`
   - `project_models.py` → `project_entity.py`
   - `crm_models.py` → `crm_entity.py`
   - `hrm_models.py` → `hrm_entity.py`
   - `inventory_models.py` → `inventory_entity.py`
   - `invoice_models.py` → `invoice_entity.py`
   - `ledger_models.py` → `ledger_entity.py`
   - `banking_models.py` → `banking_entity.py`
   - `production_models.py` → `production_entity.py`
   - `quality_control_models.py` → `quality_control_entity.py`
   - `maintenance_models.py` → `maintenance_entity.py`
   - `workshop_models.py` → `workshop_entity.py`
   - `notification_models.py` → `notification_entity.py`
   - `audit_models.py` → `audit_entity.py`
   - `event_models.py` → `event_entity.py`
   - `custom_options_models.py` → `custom_options_entity.py`
   - `investment_models.py` → `investment_entity.py`
   - `pos_models.py` → `pos_entity.py`
   - `invoice_customization_models.py` → `invoice_customization_entity.py`

---

### **PHASE 3: Infrastructure Layer** ⏱️ ~3-4 hours
**Goal:** Database access abstraction

#### Tasks:
1. Create `src/infrastructure/`:
   - `db_context.py` - Database context (migrate from `database_config.py`)
   - `connection_settings.py` - Connection settings
   - `repository.py` - Base repository classes
   - `unit_of_work.py` - Unit of Work pattern

2. Create domain-specific repositories:
   - `user_repository.py` → `user_repository.py`
   - `project_repository.py`
   - `crm_repository.py`
   - `hrm_repository.py`
   - `inventory_repository.py`
   - etc. (one per domain, ~15-20 repositories)

3. Implement Unit of Work pattern:
   - Transaction management
   - Repository aggregation

---

### **PHASE 4: Application Layer** ⏱️ ~6-8 hours (LARGEST)
**Goal:** Convert CRUD to CQRS Commands/Queries

#### Tasks:
1. Create `src/application/models/`:
   - `base_model.py` - Base application models
   - Move/reorganize Pydantic models from `src/models/`

2. Create Commands structure (write operations):
   ```
   src/application/commands/
   ├── users/
   │   ├── create_user/
   │   ├── update_user/
   │   └── delete_user/
   ├── projects/
   │   ├── create_project/
   │   ├── update_project/
   │   └── delete_project/
   ├── crm/
   ├── hrm/
   ├── inventory/
   └── ... (all domains)
   ```
   - Each command: `command.py` + `handler.py`
   - Convert ~100+ CRUD functions to commands

3. Create Queries structure (read operations):
   ```
   src/application/queries/
   ├── users/
   │   ├── get_user_by_id/
   │   ├── get_all_users/
   │   └── search_users/
   ├── projects/
   ├── crm/
   └── ... (all domains)
   ```
   - Each query: `query.py` + `handler.py`
   - Convert ~100+ CRUD functions to queries

4. Migrate Services to `src/application/services/`:
   - Move existing services from `src/services/`
   - `email_service.py`
   - `notification_service.py`
   - `s3_service.py`
   - `subscription_service.py`
   - `rbac_service.py`
   - `google_meet_service.py`
   - `inventory_sync_service.py`
   - `ledger_seeding.py`
   - Create task services in `src/application/services/tasks/`

---

### **PHASE 5: Presentation Layer** ⏱️ ~2-3 hours
**Goal:** Reorganize API routes and HTTP concerns

#### Tasks:
1. Create `src/presentation/`:
   - `exception_handlers.py` - Move from `src/core/error_handling.py`
   - Move middleware from `src/core/` to `src/presentation/middleware/`

2. Create `src/presentation/dependencies/`:
   - `auth.py` - Move auth dependencies from `src/api/dependencies.py`

3. Reorganize API routes:
   - Move `src/api/v1/*.py` to `src/presentation/internal_routers/`
   - Keep public routes separate in `src/presentation/public_routers/`
   - Update all route files to use Commands/Queries via Mediator

4. Update `main.py`:
   - Move to root `src/main.py` (already there)
   - Create `src/public_api.py` for public endpoints
   - Create `src/worker.py` for background workers

5. Create `src/presentation/schedule/`:
   - `scheduler.py` - Task scheduler

---

### **PHASE 6: Testing & Validation** ⏱️ ~2-3 hours
**Goal:** Ensure everything works

#### Tasks:
1. Update all imports across the codebase (~200+ files)
2. Test each API endpoint
3. Verify tenant isolation still works
4. Verify authentication/authorization
5. Fix any breaking changes
6. Update database imports
7. Test background services

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Core Infrastructure | CQRS foundation | **3-4 hours** |
| Phase 2: Domain Layer | Entities & Enums | **2-3 hours** |
| Phase 3: Infrastructure Layer | Repositories & UoW | **3-4 hours** |
| Phase 4: Application Layer | Commands & Queries | **6-8 hours** |
| Phase 5: Presentation Layer | Routes & Middleware | **2-3 hours** |
| Phase 6: Testing & Validation | Testing & Fixes | **2-3 hours** |
| **TOTAL** | | **18-25 hours** |

---

## Migration Strategy

### Approach:
1. **Incremental Migration**: We can migrate one domain at a time (e.g., Users → Projects → CRM)
2. **Backward Compatibility**: Keep old structure alongside new during transition
3. **Parallel Development**: New features use new architecture, old code migrated gradually

### Key Challenges:
1. **Massive Refactoring**: ~200+ files need changes
2. **Import Updates**: Every file imports need updating
3. **CRUD to CQRS**: Converting 100+ CRUD functions to Commands/Queries
4. **Testing**: Need to ensure no functionality breaks
5. **Domain Boundaries**: Properly separating concerns

### Risk Mitigation:
- Keep old code functional during migration
- Migrate one domain module at a time
- Comprehensive testing after each phase
- Version control commits at each phase milestone

---

## Recommended Execution Order

1. ✅ **Start with Core Infrastructure** - Foundation must be solid
2. ✅ **Migrate Users/Tenants first** - Core authentication domain
3. ✅ **Then Projects/Tasks** - Simple domain to validate pattern
4. ✅ **Complex domains next** - CRM, Inventory, HRM
5. ✅ **Final cleanup** - Remove old code, update documentation

---

## Success Criteria

- ✅ All API endpoints work with new architecture
- ✅ Tenant isolation maintained
- ✅ Authentication/Authorization intact
- ✅ No performance degradation
- ✅ Code is more maintainable and testable
- ✅ Follows Clean Architecture principles
- ✅ CQRS pattern properly implemented

---

**Ready to proceed?** This is a substantial refactoring that will significantly improve code maintainability and scalability.


