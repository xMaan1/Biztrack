# CQRS/Mediator Pattern Refactoring - Remaining Tasks

## Status Overview

**Completed Routes (5 files):**
- ✅ `backend/src/presentation/internal_routers/projects.py`
- ✅ `backend/src/presentation/internal_routers/users.py`
- ✅ `backend/src/presentation/internal_routers/tasks.py`
- ✅ `backend/src/presentation/internal_routers/crm.py` (all 6 entities: customers, leads, contacts, companies, opportunities, sales activities)
- ✅ `backend/src/presentation/internal_routers/work_orders.py`

**Remaining Routes: ~23 files**

## Refactoring Pattern

Each route file should follow this pattern:

### 1. Add Imports
```python
from ...presentation.dependencies.mediator import get_mediator
from ...core.mediator import Mediator
from ...core.result import Result
from ...application.commands import (
    CreateXCommand, UpdateXCommand, DeleteXCommand
)
from ...application.queries import (
    GetXByIdQuery, GetAllXQuery
)
```

### 2. Update Route Dependencies
Add to each route function:
```python
mediator: Mediator = Depends(get_mediator)
```

### 3. Replace CRUD Calls
- **GET all**: Use `GetAllXQuery` with `mediator.send(query)`
- **GET by ID**: Use `GetXByIdQuery` with `mediator.send(query)`
- **POST (Create)**: Use `CreateXCommand` with `mediator.send(command)`
- **PUT (Update)**: Use `UpdateXCommand` with `mediator.send(command)`
- **DELETE**: Use `DeleteXCommand` with `mediator.send(command)`

### 4. Handle Results
```python
result: Result = await mediator.send(command_or_query)

if not result.is_success:
    raise HTTPException(status_code=400/404/500, detail=result.error_message)

entity = result.value
# Transform entity to response model if needed
```

## Remaining Routes by Category

### Routes with Commands/Queries Available

#### 1. **banking.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: BankAccount, Till, BankTransaction, TillTransaction
- Commands: Create/Update/Delete for all 4 entities
- Queries: GetById/GetAll for all 4 entities

#### 2. **hrm.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: Employee, JobPosting, Application, PerformanceReview, TimeEntry, LeaveRequest, Payroll, Benefits, Training, TrainingEnrollment, Supplier
- Commands: Create/Update/Delete for all 11 entities
- Queries: GetById/GetAll for all 11 entities
- **Note**: Large file, multiple endpoints

#### 3. **inventory.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: Product, Warehouse, PurchaseOrder, Receiving, StorageLocation, StockMovement
- Commands: Create/Update/Delete for all 6 entities
- Queries: GetById/GetAll for all 6 entities

#### 4. **ledger.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: ChartOfAccounts, JournalEntry, LedgerTransaction, FinancialPeriod, Budget, BudgetItem, AccountReceivable
- Commands: Create/Update/Delete for all 7 entities
- Queries: GetById/GetAll for all 7 entities

#### 5. **invoices.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: Invoice, Payment
- Commands: Create/Update/Delete for both entities
- Queries: GetById/GetAll for both entities

#### 6. **sales.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: Quote, Contract
- Commands: Create/Update/Delete for both entities
- Queries: GetById/GetAll for both entities

#### 7. **pos.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: POSShift, POSTransaction
- Commands: Create/Update/Delete for both entities
- Queries: GetById/GetAll for both entities

#### 8. **production.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: ProductionPlan, ProductionStep, ProductionSchedule
- Commands: Create/Update/Delete for all 3 entities
- Queries: GetById/GetAll for all 3 entities

#### 9. **events.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: Event
- Commands: Create/Update/Delete
- Queries: GetById/GetAll

#### 10. **quality_control.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅
- Entities: QualityCheck, QualityInspection, QualityDefect, QualityReport
- Commands: Create/Update/Delete for all 4 entities
- Queries: GetById/GetAll for all 4 entities

#### 11. **maintenance.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ✅ (Queries confirmed, need to verify Commands)
- Entities: MaintenanceSchedule, MaintenanceWorkOrder, Equipment, MaintenanceReport
- Queries: GetById/GetAll for all 4 entities
- **Action**: Check if commands exist in `backend/src/application/commands/maintenance/`

#### 12. **investments.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ⚠️ (Queries confirmed, need to verify Commands)
- Entities: Investment, EquipmentInvestment, InvestmentTransaction
- Queries: GetById/GetAll for all 3 entities
- **Action**: Check if commands exist in `backend/src/application/commands/investment/`

#### 13. **notifications.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ⚠️ (Queries confirmed, need to verify Commands)
- Entities: Notification, NotificationPreference
- Queries: GetById/GetAll for both entities
- **Action**: Check if commands exist in `backend/src/application/commands/notification/`

#### 14. **invoice_customization.py** ⚠️ NEEDS REFACTORING
- Commands/Queries available: ⚠️ (Queries confirmed, need to verify Commands)
- Entities: InvoiceCustomization
- Queries: GetById/GetAll
- **Action**: Check if commands exist in `backend/src/application/commands/invoice_customization/`

### Routes Needing Investigation

#### 15. **dashboard.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if dashboard endpoints need refactoring or are aggregation/report endpoints
- **Note**: Dashboard endpoints might be read-only aggregations that don't need CQRS

#### 16. **reports.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if report endpoints need refactoring or are read-only
- **Note**: Reports might be read-only queries

#### 17. **plans.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if subscription plans have commands/queries
- **Location**: Check `backend/src/application/commands/` and `backend/src/application/queries/`

#### 18. **tenants.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if tenant management has commands/queries
- **Note**: May be core/system routes that don't follow CQRS pattern

#### 19. **subscriptions.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if subscription management has commands/queries

#### 20. **auth.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if authentication endpoints should use CQRS
- **Note**: Auth routes might need special handling (login, register, etc.)

#### 21. **admin.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check what admin endpoints exist and if they need CQRS

#### 22. **rbac_users.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if RBAC has commands/queries
- **Note**: May have role/permission queries in `backend/src/application/queries/core/`

#### 23. **file_upload.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if file upload needs CQRS pattern

#### 24. **custom_options.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if custom options have commands/queries

#### 25. **customer_import.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if import endpoints need refactoring

#### 26. **deduct_stock.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if stock deduction uses commands

#### 27. **pdf_generator_modern.py** ⚠️ NEEDS INVESTIGATION
- Commands/Queries available: ❓
- **Action**: Check if PDF generation needs CQRS
- **Note**: Likely read-only/utility endpoint

## Implementation Checklist

For each route file that needs refactoring:

- [ ] Review existing route handlers
- [ ] Identify all CRUD operations
- [ ] Check if commands/queries exist in `backend/src/application/commands/` and `backend/src/application/queries/`
- [ ] Add mediator imports
- [ ] Add `mediator: Mediator = Depends(get_mediator)` to route functions
- [ ] Replace GET endpoints with Query handlers
- [ ] Replace POST endpoints with CreateCommand handlers
- [ ] Replace PUT endpoints with UpdateCommand handlers
- [ ] Replace DELETE endpoints with DeleteCommand handlers
- [ ] Handle Result objects and error cases
- [ ] Transform domain entities to response models if needed
- [ ] Test endpoints after refactoring

## Priority Order

### High Priority (Core Business Logic)
1. **inventory.py** - Core inventory management
2. **invoices.py** - Core invoicing
3. **ledger.py** - Core accounting
4. **sales.py** - Core sales operations
5. **pos.py** - Core POS functionality

### Medium Priority (Operations)
6. **banking.py** - Financial operations
7. **hrm.py** - HR operations (large file)
8. **production.py** - Production management
9. **quality_control.py** - Quality processes
10. **maintenance.py** - Equipment maintenance

### Lower Priority (Supporting Features)
11. **events.py** - Event management
12. **investments.py** - Investment tracking
13. **notifications.py** - Notification system
14. **invoice_customization.py** - Customization

### Needs Investigation
15-27. All "Routes Needing Investigation" files

## Notes

1. **Pattern Consistency**: All refactored routes should follow the same pattern as `projects.py`, `users.py`, `tasks.py`, `crm.py`, and `work_orders.py`

2. **Handler Registration**: Ensure all handlers are registered in `backend/src/application/handler_registration.py`

3. **Error Handling**: Use consistent error handling with `Result.is_success` checks

4. **Response Transformation**: Some routes may need entity-to-response-model transformation using the old CRUD functions temporarily

5. **Date Handling**: Be careful with datetime parsing when mapping from request models to commands

6. **Optional Fields**: Handle optional fields properly when creating commands from request models

7. **Testing**: After refactoring each route file, test all endpoints to ensure they work correctly

## Files to Check for Commands/Queries

If commands/queries don't exist, they may need to be created:
- `backend/src/application/commands/maintenance/`
- `backend/src/application/commands/investment/`
- `backend/src/application/commands/notification/`
- `backend/src/application/commands/invoice_customization/`
- `backend/src/application/queries/[module]/`

## Completion Target

**Goal**: Refactor all 27 remaining route files to use CQRS/Mediator pattern

**Current Progress**: 5/32 files completed (15.6%)

**Remaining**: 27 files (84.4%)

