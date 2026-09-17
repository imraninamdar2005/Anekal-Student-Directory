from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import AcademicYear, Area, User
from app.schemas import (
    AcademicYearOut, AcademicYearBase,
    AreaOut, AreaBase
)
from app.auth import get_current_user, require_role
from app.audit import log_audit

router = APIRouter(prefix="/api/master-data", tags=["Master Data"])

# --- Academic Years ---
@router.get("/academic-years", response_model=List[AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    years = db.query(AcademicYear).order_by(AcademicYear.year_label.asc()).all()
    # If empty, generate standard future academic years
    if not years:
        sample_years = ["2024-25", "2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31"]
        for y in sample_years:
            obj = AcademicYear(year_label=y, is_current=(y == "2026-27"), is_active=True)
            db.add(obj)
        db.commit()
        years = db.query(AcademicYear).order_by(AcademicYear.year_label.asc()).all()
    return years

@router.post("/academic-years", response_model=AcademicYearOut, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    payload: AcademicYearBase,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    existing = db.query(AcademicYear).filter(AcademicYear.year_label == payload.year_label).first()
    if existing:
        raise HTTPException(status_code=400, detail="Academic year already exists")
    ay = AcademicYear(year_label=payload.year_label.strip(), is_current=payload.is_current, is_active=payload.is_active)
    db.add(ay)
    db.commit()
    db.refresh(ay)
    log_audit(db, current_user, "CREATE_ACADEMIC_YEAR", "AcademicYear", entity_id=str(ay.id), details={"label": ay.year_label}, request=request)
    return ay

@router.put("/academic-years/{id}/set-current")
def set_current_academic_year(
    id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    ay = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic year not found")
    # Reset others
    db.query(AcademicYear).update({AcademicYear.is_current: False})
    ay.is_current = True
    db.commit()
    log_audit(db, current_user, "SET_CURRENT_ACADEMIC_YEAR", "AcademicYear", entity_id=str(ay.id), details={"current_year": ay.year_label}, request=request)
    return {"message": f"Academic year {ay.year_label} set as current.", "current_year": ay.year_label}

# --- Areas ---
@router.get("/areas", response_model=List[AreaOut])
def list_areas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Area).order_by(Area.area_name).all()

@router.post("/areas", response_model=AreaOut, status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaBase,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Area).filter(Area.area_name == payload.area_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Area already exists")
    area = Area(
        area_name=payload.area_name.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    log_audit(db, current_user, "CREATE_AREA", "Area", entity_id=str(area.id), details={"area_name": area.area_name}, request=request)
    return area

@router.delete("/areas/{id}")
def delete_area(
    id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    area = db.query(Area).filter(Area.id == id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    name = area.area_name
    db.delete(area)
    db.commit()
    log_audit(db, current_user, "DELETE_AREA", "Area", entity_id=str(id), details={"area_name": name}, request=request)
    return {"message": f"Area '{name}' deleted successfully"}
