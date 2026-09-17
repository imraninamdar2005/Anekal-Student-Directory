from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import School, Student, User
from app.schemas import SchoolCreate, SchoolUpdate, SchoolOut
from app.auth import get_current_user, require_role
from app.audit import log_audit
from app.routers.students import sanitize_student_for_role

router = APIRouter(prefix="/api/schools", tags=["Schools"])

@router.get("", response_model=List[SchoolOut])
def list_schools(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schools = db.query(School).order_by(School.school_name).all()
    results = []
    for s in schools:
        count = db.query(func.count(Student.id)).filter(Student.school_id == s.id).scalar()
        out = SchoolOut.model_validate(s)
        out.student_count = count or 0
        results.append(out)
    return results

@router.get("/{id}")
def get_school_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    school = db.query(School).filter(School.id == id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    total_students = db.query(func.count(Student.id)).filter(Student.school_id == school.id).scalar() or 0

    # 1. Academic Years breakdown
    academic_years = (
        db.query(Student.academic_year, func.count(Student.id))
        .filter(Student.school_id == school.id, Student.academic_year != None)
        .group_by(Student.academic_year)
        .order_by(Student.academic_year.asc())
        .all()
    )

    # 2. Passout Years breakdown
    passout_years = (
        db.query(Student.passout_year, func.count(Student.id))
        .filter(Student.school_id == school.id, Student.passout_year != None)
        .group_by(Student.passout_year)
        .order_by(Student.passout_year.asc())
        .all()
    )

    # Fetch all students for this school
    students = db.query(Student).filter(Student.school_id == school.id).order_by(Student.full_name).all()

    return {
        "school": SchoolOut.model_validate(school),
        "total_students": total_students,
        "academic_years_breakdown": [{"year": ay[0], "count": ay[1]} for ay in academic_years],
        "passout_years_breakdown": [{"year": py[0], "count": py[1]} for py in passout_years],
        "students": [sanitize_student_for_role(st, current_user.role) for st in students]
    }

@router.post("", response_model=SchoolOut, status_code=status.HTTP_201_CREATED)
def create_school(
    payload: SchoolCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    existing = db.query(School).filter(School.school_name == payload.school_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A school with this name already exists")

    school = School(
        school_name=payload.school_name.strip(),
        locality=payload.locality.strip() if payload.locality else None,
        is_active=payload.is_active
    )
    db.add(school)
    db.commit()
    db.refresh(school)

    log_audit(
        db, current_user, "CREATE_SCHOOL", "School",
        entity_id=str(school.id),
        details={"name": school.school_name},
        request=request
    )

    out = SchoolOut.model_validate(school)
    out.student_count = 0
    return out

@router.put("/{id}", response_model=SchoolOut)
def update_school(
    id: int,
    payload: SchoolUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(school, k, v)

    db.commit()
    db.refresh(school)

    log_audit(
        db, current_user, "UPDATE_SCHOOL", "School",
        entity_id=str(school.id),
        details={"updated_fields": list(update_dict.keys())},
        request=request
    )

    count = db.query(func.count(Student.id)).filter(Student.school_id == school.id).scalar()
    out = SchoolOut.model_validate(school)
    out.student_count = count or 0
    return out

@router.delete("/{id}")
def delete_school(
    id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    student_count = db.query(func.count(Student.id)).filter(Student.school_id == school.id).scalar() or 0
    if student_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete school with {student_count} associated students. Reassign students first.")

    name = school.school_name
    db.delete(school)
    db.commit()

    log_audit(
        db, current_user, "DELETE_SCHOOL", "School",
        entity_id=str(id),
        details={"school_name": name},
        request=request
    )

    return {"message": f"School '{name}' deleted successfully"}
