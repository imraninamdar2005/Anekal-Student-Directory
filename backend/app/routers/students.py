import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from app.database import get_db
from app.models import Student, School, College, Area, User
from app.schemas import (
    StudentCreate, StudentUpdate,
    DuplicateCheckRequest, DuplicateCheckResult
)
from app.auth import get_current_user, require_role
from app.audit import log_audit

router = APIRouter(prefix="/api/students", tags=["Students"])

def generate_student_id(db: Session) -> str:
    count = db.query(func.count(Student.id)).scalar() or 0
    next_num = count + 1
    while True:
        candidate = f"ANL-{next_num:04d}"
        if not db.query(Student).filter(Student.student_id == candidate).first():
            return candidate
        next_num += 1

def sanitize_student_for_role(student: Student, role: str) -> dict:
    data = {
        "id": student.id,
        "student_id": student.student_id,
        "full_name": student.full_name,
        "parent_guardian_relation": student.parent_guardian_relation or "Father",
        "parent_guardian_name": student.parent_guardian_name,
        "education_type": student.education_type,
        "school_id": student.school_id,
        "college_id": student.college_id,
        "school_name": student.school.school_name if student.school else None,
        "college_name": student.college.college_name if student.college else None,
        "class_or_standard": student.class_or_standard,
        "course_degree": student.course_degree,
        "branch_specialization": student.branch_specialization,
        "current_year_sem": student.current_year_sem,
        "academic_year": student.academic_year,
        "passout_year": student.passout_year,
        "area_id": student.area_id,
        "area_name": student.area.area_name if student.area else None,
        "address": student.address,
        "near_masjid": student.near_masjid if student.near_masjid else "Not Provided",
        "current_status": student.current_status,
        "profession": student.profession,
        "created_at": student.created_at,
        "updated_at": student.updated_at,
        "created_by": student.created_by,
        "updated_by": student.updated_by,
    }

    # Privacy Protection: Viewers have redacted contact info
    if role in ["Admin", "Data Manager"]:
        data["contact_number"] = student.contact_number
        data["second_number"] = student.second_number
        data["second_number_relation"] = student.second_number_relation
    else:
        data["contact_number"] = "••••••••••" if student.contact_number else None
        data["second_number"] = "••••••••••" if student.second_number else None
        data["second_number_relation"] = student.second_number_relation if student.second_number else None

    return data

@router.get("")
def list_students(
    q: Optional[str] = Query(None, description="Search across student name, student ID, school, college, course, area"),
    education_type: Optional[str] = None,
    school_id: Optional[int] = None,
    college_id: Optional[int] = None,
    institution_type: Optional[str] = None,  # "School" or "College / University"
    institution_id: Optional[int] = None,
    academic_year: Optional[str] = None,
    passout_year: Optional[int] = None,
    area_id: Optional[int] = None,
    current_status: Optional[str] = None,
    class_or_course: Optional[str] = None,
    course_degree: Optional[str] = None,
    class_or_standard: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student).outerjoin(School, Student.school_id == School.id)\
                             .outerjoin(College, Student.college_id == College.id)\
                             .outerjoin(Area, Student.area_id == Area.id)

    # Search filter
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(term),
                Student.full_name.ilike(term),
                Student.parent_guardian_name.ilike(term),
                Student.contact_number.ilike(term),
                Student.second_number.ilike(term),
                Student.class_or_standard.ilike(term),
                Student.course_degree.ilike(term),
                Student.branch_specialization.ilike(term),
                Student.current_year_sem.ilike(term),
                Student.academic_year.ilike(term),
                Student.current_status.ilike(term),
                Student.profession.ilike(term),
                Student.address.ilike(term),
                Student.near_masjid.ilike(term),
                School.school_name.ilike(term),
                College.college_name.ilike(term),
                Area.area_name.ilike(term),
            )
        )

    # Multi-filters
    if education_type and education_type != "All":
        query = query.filter(Student.education_type == education_type)
    if school_id:
        query = query.filter(Student.school_id == school_id)
    if college_id:
        query = query.filter(Student.college_id == college_id)
    if academic_year and academic_year != "All":
        query = query.filter(Student.academic_year == academic_year)
    if passout_year and passout_year != "All":
        query = query.filter(Student.passout_year == int(passout_year))
    if area_id and area_id != "All":
        query = query.filter(Student.area_id == int(area_id))
    if current_status and current_status != "All":
        query = query.filter(Student.current_status == current_status)
    if class_or_course and class_or_course != "All":
        query = query.filter(
            or_(
                Student.class_or_standard == class_or_course,
                Student.course_degree == class_or_course,
            )
        )
    if course_degree:
        query = query.filter(Student.course_degree == course_degree)
    if class_or_standard:
        query = query.filter(Student.class_or_standard == class_or_standard)

    total_count = query.count()

    # Sorting
    sort_column = getattr(Student, sort_by, Student.created_at)
    if sort_dir.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    # Pagination
    students = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [sanitize_student_for_role(s, current_user.role) for s in students],
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit
    }

@router.get("/{id}")
def get_student(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    return sanitize_student_for_role(student, current_user.role)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    student_id = payload.student_id or generate_student_id(db)

    # Check if student_id already taken
    if db.query(Student).filter(Student.student_id == student_id).first():
        student_id = generate_student_id(db)

    student = Student(
        student_id=student_id,
        full_name=payload.full_name.strip(),
        parent_guardian_relation=payload.parent_guardian_relation or "Father",
        parent_guardian_name=payload.parent_guardian_name.strip() if payload.parent_guardian_name else None,
        contact_number=payload.contact_number.strip() if payload.contact_number else None,
        second_number=payload.second_number.strip() if payload.second_number else None,
        second_number_relation=payload.second_number_relation if payload.second_number else "Parent",
        education_type=payload.education_type,
        school_id=payload.school_id if payload.education_type == "School" else None,
        college_id=payload.college_id if payload.education_type == "College / University" else None,
        class_or_standard=payload.class_or_standard if payload.education_type == "School" else None,
        course_degree=payload.course_degree if payload.education_type == "College / University" else None,
        branch_specialization=payload.branch_specialization if payload.education_type == "College / University" else None,
        current_year_sem=payload.current_year_sem if payload.education_type == "College / University" else None,
        academic_year=payload.academic_year,
        passout_year=payload.passout_year,
        area_id=payload.area_id,
        address=payload.address.strip() if payload.address else None,
        near_masjid=payload.near_masjid.strip() if payload.near_masjid else None,
        current_status=payload.current_status,
        profession=payload.profession if payload.current_status == "Passed Out" else None,
        created_by=current_user.username,
        updated_by=current_user.username
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    log_audit(
        db, current_user, "CREATE_STUDENT", "Student",
        entity_id=student.student_id,
        details={"student_name": student.full_name, "education_type": student.education_type},
        request=request
    )

    return sanitize_student_for_role(student, current_user.role)

@router.put("/{id}")
def update_student(
    id: int,
    payload: StudentUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(student, field, value)

    student.updated_by = current_user.username
    student.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(student)

    log_audit(
        db, current_user, "UPDATE_STUDENT", "Student",
        entity_id=student.student_id,
        details={"updated_fields": list(update_dict.keys())},
        request=request
    )

    return sanitize_student_for_role(student, current_user.role)

@router.delete("/{id}")
def delete_student(
    id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    student_id = student.student_id
    student_name = student.full_name

    db.delete(student)
    db.commit()

    log_audit(
        db, current_user, "DELETE_STUDENT", "Student",
        entity_id=student_id,
        details={"deleted_student": student_name},
        request=request
    )

    return {"message": f"Student {student_id} successfully deleted"}

@router.post("/check-duplicate", response_model=DuplicateCheckResult)
def check_duplicate(
    payload: DuplicateCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reasons = []
    matches = []

    # Check 1: Matching name
    name_matches = db.query(Student).filter(
        Student.full_name.ilike(payload.full_name.strip())
    ).all()

    if name_matches:
        for s in name_matches:
            reason = f"Matching name: {s.full_name}"
            if payload.contact_number and s.contact_number and payload.contact_number == s.contact_number:
                reason += f" with matching contact ({payload.contact_number})"
            if payload.academic_year and s.academic_year == payload.academic_year:
                reason += f" in academic session {s.academic_year}"
            reasons.append(reason)
            matches.append(sanitize_student_for_role(s, current_user.role))

    # Check 2: Matching contact number
    if payload.contact_number:
        contact_matches = db.query(Student).filter(
            Student.contact_number == payload.contact_number.strip()
        ).all()
        for s in contact_matches:
            if s.id not in [m["id"] for m in matches]:
                reasons.append(f"Matching contact number: {payload.contact_number} for {s.full_name}")
                matches.append(sanitize_student_for_role(s, current_user.role))

    return {
        "is_duplicate": len(matches) > 0,
        "matching_students": matches,
        "reasons": reasons
    }
