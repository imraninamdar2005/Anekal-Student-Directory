import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="Viewer", nullable=False)  # Admin, Data Manager, Viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(255), unique=True, index=True, nullable=False)
    locality = Column(String(255), nullable=True)  # Area
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="school")

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    college_name = Column(String(255), unique=True, index=True, nullable=False)
    locality = Column(String(255), nullable=True)  # Area
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="college")

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    year_label = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "2025-26", "2026-27"
    is_current = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    area_name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="area")

class Profession(Base):
    __tablename__ = "professions"

    id = Column(Integer, primary_key=True, index=True)
    profession_name = Column(String(255), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), index=True, nullable=False)  # Student Name
    
    # Parent / Guardian Information
    parent_guardian_relation = Column(String(50), default="Father", nullable=True)  # Father, Mother, Guardian, Other
    parent_guardian_name = Column(String(255), nullable=True)
    
    # Contact numbers
    contact_number = Column(String(50), index=True, nullable=True)  # Contact Number
    second_number = Column(String(50), nullable=True)  # Second Number (Optional)
    second_number_relation = Column(String(50), default="Parent", nullable=True)  # Parent, Guardian, Alternate Contact

    # Education type: "School" or "College / University"
    education_type = Column(String(50), default="School", nullable=False)
    
    # Institution relations
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True, index=True)

    # Dynamic fields for School
    class_or_standard = Column(String(100), nullable=True)  # 1st, 2nd, ..., 10th, Other

    # Dynamic fields for College / University
    course_degree = Column(String(100), nullable=True)  # BE, BTech, BCA, BSc, BCom, BA, Diploma, MBA, MCA, Other
    branch_specialization = Column(String(100), nullable=True)  # Computer Science, Mechanical, etc.
    current_year_sem = Column(String(100), nullable=True)  # 1st Year, 2nd Year, 3rd Year, 4th Year, etc.

    # Cohort tracking
    academic_year = Column(String(50), index=True, nullable=True)  # e.g., "2026-27"
    passout_year = Column(Integer, index=True, nullable=True)  # e.g., 2027

    # Location
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True, index=True)
    address = Column(Text, nullable=True)  # Address (Optional)
    near_masjid = Column(String(255), nullable=True)  # Near which Masjid? (Optional, voluntarily provided)
    
    # Status & Profession
    current_status = Column(String(100), default="Currently Studying", nullable=False)  # Currently Studying, Passed Out, Other
    profession = Column(String(255), nullable=True)  # Software Engineer, Teacher, Business, Government Job, Student, Other

    # Audit metadata
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    # Relationships
    school = relationship("School", back_populates="students")
    college = relationship("College", back_populates="students")
    area = relationship("Area", back_populates="students")

# Composite index for search and filtering
Index("idx_student_fullname", Student.full_name)
Index("idx_student_academics", Student.academic_year, Student.passout_year)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), index=True, nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
