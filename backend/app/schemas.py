from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List
import datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str  # Admin, Data Manager, Viewer
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- School Schemas ---
class SchoolBase(BaseModel):
    school_name: str
    locality: Optional[str] = None
    is_active: bool = True

class SchoolCreate(SchoolBase):
    pass

class SchoolUpdate(BaseModel):
    school_name: Optional[str] = None
    locality: Optional[str] = None
    is_active: Optional[bool] = None

class SchoolOut(SchoolBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    student_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# --- College Schemas ---
class CollegeBase(BaseModel):
    college_name: str
    locality: Optional[str] = None
    is_active: bool = True

class CollegeCreate(CollegeBase):
    pass

class CollegeUpdate(BaseModel):
    college_name: Optional[str] = None
    locality: Optional[str] = None
    is_active: Optional[bool] = None

class CollegeOut(CollegeBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    student_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# --- Master Data Schemas ---
class AcademicYearBase(BaseModel):
    year_label: str
    is_current: bool = False
    is_active: bool = True

class AcademicYearOut(AcademicYearBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class AreaBase(BaseModel):
    area_name: str
    description: Optional[str] = None
    is_active: bool = True

class AreaOut(AreaBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ProfessionBase(BaseModel):
    profession_name: str
    is_active: bool = True

class ProfessionOut(ProfessionBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Student Schemas ---
class StudentBase(BaseModel):
    student_id: Optional[str] = None
    full_name: str
    
    parent_guardian_relation: Optional[str] = "Father"  # Father, Mother, Guardian, Other
    parent_guardian_name: Optional[str] = None
    
    contact_number: Optional[str] = None
    second_number: Optional[str] = None
    second_number_relation: Optional[str] = "Parent"  # Parent, Guardian, Alternate Contact

    education_type: str = "School"  # School, College / University
    school_id: Optional[int] = None
    college_id: Optional[int] = None

    class_or_standard: Optional[str] = None  # 1st, 2nd, ..., 10th, Other
    course_degree: Optional[str] = None  # BE, BTech, BCA, BSc, BCom, BA, Diploma, MBA, MCA, Other
    branch_specialization: Optional[str] = None
    current_year_sem: Optional[str] = None  # 1st Year, 2nd Year, etc.

    academic_year: Optional[str] = None  # e.g., "2026-27"
    passout_year: Optional[int] = None  # e.g., 2027

    area_id: Optional[int] = None
    address: Optional[str] = None
    near_masjid: Optional[str] = None  # Near which Masjid? (Optional)
    
    current_status: str = "Currently Studying"  # Currently Studying, Passed Out, Other
    profession: Optional[str] = None

    @field_validator("contact_number", "second_number")
    @classmethod
    def validate_contact(cls, v):
        if v:
            clean = "".join(filter(str.isdigit, str(v)))
            if len(clean) < 7 or len(clean) > 15:
                raise ValueError("Contact number must contain between 7 and 15 digits.")
        return v

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    parent_guardian_relation: Optional[str] = None
    parent_guardian_name: Optional[str] = None
    contact_number: Optional[str] = None
    second_number: Optional[str] = None
    second_number_relation: Optional[str] = None

    education_type: Optional[str] = None
    school_id: Optional[int] = None
    college_id: Optional[int] = None

    class_or_standard: Optional[str] = None
    course_degree: Optional[str] = None
    branch_specialization: Optional[str] = None
    current_year_sem: Optional[str] = None

    academic_year: Optional[str] = None
    passout_year: Optional[int] = None
    area_id: Optional[int] = None
    address: Optional[str] = None
    near_masjid: Optional[str] = None
    current_status: Optional[str] = None
    profession: Optional[str] = None

class StudentOut(StudentBase):
    id: int
    school_name: Optional[str] = None
    college_name: Optional[str] = None
    area_name: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Duplicate Detection & Validation ---
class DuplicateCheckRequest(BaseModel):
    full_name: str
    contact_number: Optional[str] = None
    school_id: Optional[int] = None
    college_id: Optional[int] = None
    academic_year: Optional[str] = None

class DuplicateCheckResult(BaseModel):
    is_duplicate: bool
    matching_students: List[StudentOut] = []
    reasons: List[str] = []

# --- Import & Export Schemas ---
class ImportRowResult(BaseModel):
    row_number: int
    data: dict
    status: str  # "valid", "invalid", "duplicate"
    errors: List[str] = []
    duplicate_info: Optional[str] = None

class ImportPreviewResponse(BaseModel):
    total_rows: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    preview_rows: List[ImportRowResult]
    column_headers: List[str]

class ImportCommitRequest(BaseModel):
    rows: List[dict]

# --- Dashboard & Stats Schemas ---
class DashboardOverview(BaseModel):
    total_students: int
    total_schools: int
    total_colleges: int
    school_students: int
    college_students: int
    recently_added: List[StudentOut]
    recently_modified: List[StudentOut]

class ChartDataPoint(BaseModel):
    label: str
    value: int

class DashboardCharts(BaseModel):
    by_school: List[ChartDataPoint]
    by_college: List[ChartDataPoint]
    by_passout_year: List[ChartDataPoint]

# --- Audit Log Schema ---
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    username: str
    user_role: str
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
