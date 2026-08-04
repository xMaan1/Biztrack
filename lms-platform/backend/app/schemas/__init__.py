"""
Pydantic Schemas - Data Transfer Objects
All schemas are imported here for easy access
"""

from .auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    VerifyEmailRequest,
)
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserProfileBase,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserWithProfileResponse,
)
from .role import RoleBase, RoleCreate, RoleUpdate, RoleResponse
from .department import DepartmentBase, DepartmentCreate, DepartmentUpdate, DepartmentResponse
from .course import (
    CourseBase,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
)
from .enrollment import (
    EnrollmentBase,
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
    EnrollmentListResponse,
)
from .lecture import (
    LectureBase,
    LectureCreate,
    LectureUpdate,
    LectureResponse,
    LectureListResponse,
)
from .material import (
    MaterialBase,
    MaterialCreate,
    MaterialUpdate,
    MaterialResponse,
)
from .attendance import (
    AttendanceSessionBase,
    AttendanceSessionCreate,
    AttendanceSessionUpdate,
    AttendanceSessionResponse,
    AttendanceRecordBase,
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
    AttendanceRecordResponse,
    QRCodeResponse,
    FaceRecognitionRequest,
    FaceRecognitionResponse,
)
from .assignment import (
    AssignmentBase,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentListResponse,
)
from .submission import (
    SubmissionBase,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    SubmissionListResponse,
)
from .grade import (
    GradeBase,
    GradeCreate,
    GradeUpdate,
    GradeResponse,
    GradeListResponse,
)
from .common import (
    PaginationParams,
    PaginatedResponse,
    ResponseWrapper,
    ErrorResponse,
    ValidationErrorResponse,
)

__all__ = [
    # Auth
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
    "RegisterResponse",
    "TokenRefreshRequest",
    "TokenRefreshResponse",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "PasswordResetConfirmRequest",
    "VerifyEmailRequest",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserProfileBase",
    "UserProfileCreate",
    "UserProfileUpdate",
    "UserProfileResponse",
    "UserWithProfileResponse",
    # Role
    "RoleBase",
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    # Department
    "DepartmentBase",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",
    # Course
    "CourseBase",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
    # Enrollment
    "EnrollmentBase",
    "EnrollmentCreate",
    "EnrollmentUpdate",
    "EnrollmentResponse",
    "EnrollmentListResponse",
    # Lecture
    "LectureBase",
    "LectureCreate",
    "LectureUpdate",
    "LectureResponse",
    "LectureListResponse",
    # Material
    "MaterialBase",
    "MaterialCreate",
    "MaterialUpdate",
    "MaterialResponse",
    # Attendance
    "AttendanceSessionBase",
    "AttendanceSessionCreate",
    "AttendanceSessionUpdate",
    "AttendanceSessionResponse",
    "AttendanceRecordBase",
    "AttendanceRecordCreate",
    "AttendanceRecordUpdate",
    "AttendanceRecordResponse",
    "QRCodeResponse",
    "FaceRecognitionRequest",
    "FaceRecognitionResponse",
    # Assignment
    "AssignmentBase",
    "AssignmentCreate",
    "AssignmentUpdate",
    "AssignmentResponse",
    "AssignmentListResponse",
    # Submission
    "SubmissionBase",
    "SubmissionCreate",
    "SubmissionUpdate",
    "SubmissionResponse",
    "SubmissionListResponse",
    # Grade
    "GradeBase",
    "GradeCreate",
    "GradeUpdate",
    "GradeResponse",
    "GradeListResponse",
    # Common
    "PaginationParams",
    "PaginatedResponse",
    "ResponseWrapper",
    "ErrorResponse",
    "ValidationErrorResponse",
]