from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import College, Student, User
from app.schemas import CollegeCreate, CollegeUpdate, CollegeOut
from app.auth import get_current_user, require_role
from app.audit import log_audit
from app.routers.students import sanitize_student_for_role

router = APIRouter(prefix="/api/colleges", tags=["Colleges"])

@router.get("", response_model=List[CollegeOut])
def list_colleges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    colleges = db.query(College).order_by(College.college_name).all()
    results = []
    for c in colleges:
        count = db.query(func.count(Student.id)).filter(Student.college_id == c.id).scalar()
        out = CollegeOut.model_validate(c)
        out.student_count = count or 0
        results.append(out)
    return results

@router.get("/{id}")
def get_college_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    college = db.query(College).filter(College.id == id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    total_students = db.query(func.count(Student.id)).filter(Student.college_id == college.id).scalar() or 0

    # 1. Academic Years breakdown
    academic_years = (
        db.query(Student.academic_year, func.count(Student.id))
        .filter(Student.college_id == college.id, Student.academic_year != None)
        .group_by(Student.academic_year)
        .order_by(Student.academic_year.asc())
        .all()
    )

    # 2. Passout Years breakdown
    passout_years = (
        db.query(Student.passout_year, func.count(Student.id))
        .filter(Student.college_id == college.id, Student.passout_year != None)
        .group_by(Student.passout_year)
        .order_by(Student.passout_year.asc())
        .all()
    )

    # Fetch all students for this college
    students = db.query(Student).filter(Student.college_id == college.id).order_by(Student.full_name).all()

    return {
        "college": CollegeOut.model_validate(college),
        "total_students": total_students,
        "academic_years_breakdown": [{"year": ay[0], "count": ay[1]} for ay in academic_years],
        "passout_years_breakdown": [{"year": py[0], "count": py[1]} for py in passout_years],
        "students": [sanitize_student_for_role(st, current_user.role) for st in students]
    }

@router.post("", response_model=CollegeOut, status_code=status.HTTP_201_CREATED)
def create_college(
    payload: CollegeCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    existing = db.query(College).filter(College.college_name == payload.college_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A college with this name already exists")

    college = College(
        college_name=payload.college_name.strip(),
        locality=payload.locality.strip() if payload.locality else None,
        is_active=payload.is_active
    )
    db.add(college)
    db.commit()
    db.refresh(college)

    log_audit(
        db, current_user, "CREATE_COLLEGE", "College",
        entity_id=str(college.id),
        details={"name": college.college_name},
        request=request
    )

    out = CollegeOut.model_validate(college)
    out.student_count = 0
    return out

@router.put("/{id}", response_model=CollegeOut)
def update_college(
    id: int,
    payload: CollegeUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    college = db.query(College).filter(College.id == id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(college, k, v)

    db.commit()
    db.refresh(college)

    log_audit(
        db, current_user, "UPDATE_COLLEGE", "College",
        entity_id=str(college.id),
        details={"updated_fields": list(update_dict.keys())},
        request=request
    )

    count = db.query(func.count(Student.id)).filter(Student.college_id == college.id).scalar()
    out = CollegeOut.model_validate(college)
    out.student_count = count or 0
    return out

@router.delete("/{id}")
def delete_college(
    id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    college = db.query(College).filter(College.id == id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    student_count = db.query(func.count(Student.id)).filter(Student.college_id == college.id).scalar() or 0
    if student_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete college with {student_count} associated students. Reassign students first.")

    name = college.college_name
    db.delete(college)
    db.commit()

    log_audit(
        db, current_user, "DELETE_COLLEGE", "College",
        entity_id=str(id),
        details={"college_name": name},
        request=request
    )

    return {"message": f"College '{name}' deleted successfully"}
