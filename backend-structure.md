# Backend Basic Structure

Clean Architecture implementation with CQRS pattern for a medical imaging application backend.

## Source Code Structure (`src/`)

### Main Entry Points

```
src/
├── main.py                        # Main FastAPI application entry point
├── public_api.py                  # Public API endpoints
├── worker.py                      # Background worker processes
```

### Core Layer (`src/core/`)

The core layer contains the fundamental building blocks of the CQRS pattern and dependency injection.

```
src/core/
├── __init__.py
├── command.py                     # Base command classes
├── di_container.py                # Dependency injection container
├── event_handler.py               # Event handling infrastructure
├── event_interface.py             # Event interfaces
├── handler_interface.py           # Handler interfaces
├── mediator.py                    # Mediator pattern implementation
├── paged_query.py                 # Paginated query base classes
├── paged_result.py                # Paginated result classes
├── query.py                       # Base query classes
├── request_handler.py             # Request handler base classes
├── request_interface.py           # Request interfaces
├── result.py                      # Result wrapper classes
└── searchable_query.py            # Searchable query base classes
```

### Domain Layer (`src/domain/`)

The domain layer contains business entities and value objects.

#### Entities (`src/domain/entities/`)

```
src/domain/entities/
├── __init__.py
├── entity.py                      # Base entity class
└── [entity_files].py              # Domain entities
```

#### Enums (`src/domain/enums/`)

```
src/domain/enums/
├── __init__.py
└── [enum_files].py                # Domain enumerations
```

### Infrastructure Layer (`src/infrastructure/`)

The infrastructure layer handles external concerns like database, caching, and external services.

```
src/infrastructure/
├── __init__.py
├── connection_settings.py         # Database connection settings
├── db_context.py                  # Database context
├── redis_database.py              # Redis database integration
├── repository.py                  # Base repository classes
├── unit_of_work.py                # Unit of Work pattern implementation
```

### Application Layer (`src/application/`)

The application layer contains use cases, commands, queries, and services.

#### Commands (`src/application/commands/`)

Commands represent write operations in the CQRS pattern.

```
src/application/commands/[domain]/
└── [command_name]/
    ├── __init__.py
    ├── command.py
    └── handler.py
```

#### Queries (`src/application/queries/`)

Queries represent read operations in the CQRS pattern.

```
src/application/queries/[domain]/
└── [query_name]/
    ├── __init__.py
    ├── handler.py
    └── query.py
```

#### Models (`src/application/models/`)

Application layer models and DTOs.

```
src/application/models/
├── __init__.py
├── base_model.py                  # Base model classes
└── [model_files].py               # Application models and DTOs
```

#### Services (`src/application/services/`)

Application services handle business logic and external integrations.

```
src/application/services/
├── __init__.py
├── notification_service.py        # Notification service
├── pdf_service.py                 # PDF generation service
├── storage_service.py             # File storage service
├── token_service.py               # Token management service
├── user_service.py                # User management service
└── tasks/                         # Background task services
    └── task_service.py            # Task management service
```

### Presentation Layer (`src/presentation/`)

The presentation layer handles HTTP requests and responses.

```
src/presentation/
├── __init__.py
├── auth.py                        # Authentication middleware
├── exception_handlers.py          # Exception handling
├── dependencies/                  # Dependency injection
│   ├── __init__.py
│   └── auth.py
├── internal_routers/              # Internal API routes
│   ├── __init__.py
│   └── [route_files].py           # API route handlers
├── middleware/                    # HTTP middleware
│   ├── __init__.py
│   └── [middleware_files].py      # HTTP middleware
├── public_routers/                # Public API routes
│   ├── __init__.py
│   └── [route_files].py           # Public API route handlers
└── schedule/                      # Scheduled tasks
    └── scheduler.py               # Task scheduler
```

### Tests (`src/tests/`)

Test suite structure.

```
src/tests/
├── __init__.py
├── conftest.py                    # Test configuration
├── api/                           # API tests
│   ├── internal/                  # Internal API tests
│   │   ├── __init__.py
│   │   ├── constants.py
│   │   └── [test_files].py        # Internal API test files
│   └── public/                    # Public API tests
│       ├── __init__.py
│       ├── constants.py
│       └── [test_files].py        # Public API test files
│   └── test_auth.py               # Authentication tests
├── data/                          # Test data
│   └── [test_data_files]          # Sample test data files
└── seed/                          # Database seeding for tests
    ├── seed_db.py                 # Database seeding script
    └── test_data.py               # Test data definitions
```

## Architecture Patterns Used

1. **Clean Architecture**: Separation of concerns with domain, application, infrastructure, and presentation layers
2. **CQRS (Command Query Responsibility Segregation)**: Separate read and write operations
3. **Domain-Driven Design (DDD)**: Business logic organized around domain entities
4. **Dependency Injection**: Using a container for managing dependencies
5. **Repository Pattern**: Data access abstraction
6. **Unit of Work**: Transaction management
7. **Mediator Pattern**: Request/response handling
