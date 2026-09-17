from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import Student, School, College, User
from app.schemas import DashboardOverview, DashboardCharts, ChartDataPoint
from app.auth import get_current_user
from app.routers.students import sanitize_student_for_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_schools = db.query(func.count(School.id)).scalar() or 0
    total_colleges = db.query(func.count(College.id)).scalar() or 0
    school_students = db.query(func.count(Student.id)).filter(Student.education_type == "School").scalar() or 0
    college_students = db.query(func.count(Student.id)).filter(Student.education_type == "College / University").scalar() or 0

    recently_added = (
        db.query(Student)
        .order_by(desc(Student.created_at))
        .limit(5)
        .all()
    )

    recently_modified = (
        db.query(Student)
        .order_by(desc(Student.updated_at))
        .limit(5)
        .all()
    )

    return {
        "total_students": total_students,
        "total_schools": total_schools,
        "total_colleges": total_colleges,
        "school_students": school_students,
        "college_students": college_students,
        "recently_added": [sanitize_student_for_role(s, current_user.role) for s in recently_added],
        "recently_modified": [sanitize_student_for_role(s, current_user.role) for s in recently_modified],
    }

@router.get("/charts", response_model=DashboardCharts)
def get_dashboard_charts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. By School
    by_sch = (
        db.query(School.school_name, func.count(Student.id))
        .join(Student, Student.school_id == School.id)
        .group_by(School.school_name)
        .order_by(desc(func.count(Student.id)))
        .limit(8)
        .all()
    )

    # 2. By College / University
    by_col = (
        db.query(College.college_name, func.count(Student.id))
        .join(Student, Student.college_id == College.id)
        .group_by(College.college_name)
        .order_by(desc(func.count(Student.id)))
        .limit(8)
        .all()
    )

    # 3. By Passout Year
    by_py = (
        db.query(Student.passout_year, func.count(Student.id))
        .filter(Student.passout_year != None)
        .group_by(Student.passout_year)
        .order_by(Student.passout_year.asc())
        .all()
    )

    return {
        "by_school": [ChartDataPoint(label=str(r[0]), value=r[1]) for r in by_sch],
        "by_college": [ChartDataPoint(label=str(r[0]), value=r[1]) for r in by_col],
        "by_passout_year": [ChartDataPoint(label=str(r[0]), value=r[1]) for r in by_py],
    }
