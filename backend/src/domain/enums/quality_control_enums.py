import enum

class QualityStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    CONDITIONAL_PASS = "conditional_pass"
    REQUIRES_REVIEW = "requires_review"

class QualityPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class InspectionType(str, enum.Enum):
    VISUAL = "visual"
    DIMENSIONAL = "dimensional"
    FUNCTIONAL = "functional"
    MATERIAL = "material"
    SAFETY = "safety"
    ENVIRONMENTAL = "environmental"
    DOCUMENTATION = "documentation"

class DefectSeverity(str, enum.Enum):
    MINOR = "minor"
    MAJOR = "major"
    CRITICAL = "critical"
    BLOCKER = "blocker"

class QualityStandard(str, enum.Enum):
    ISO_9001 = "iso_9001"
    ISO_14001 = "iso_14001"
    ISO_45001 = "iso_45001"
    FDA = "fda"
    CE = "ce"
    CUSTOM = "custom"

