import io
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd

from app.database import get_db
from app.models import Student, School, College, Area, User
from app.schemas import ImportPreviewResponse, ImportRowResult, ImportCommitRequest
from app.auth import get_current_user, require_role
from app.audit import log_audit
from app.routers.students import generate_student_id

router = APIRouter(prefix="/api/data-transfer", tags=["Import / Export"])

@router.post("/import/preview", response_model=ImportPreviewResponse)
async def preview_import_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.")

    content = await file.read()
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    df = df.fillna("")
    preview_rows = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    schools = {s.school_name.lower(): s.id for s in db.query(School).all()}
    colleges = {c.college_name.lower(): c.id for c in db.query(College).all()}
    areas = {a.area_name.lower(): a.id for a in db.query(Area).all()}

    headers = [str(col).strip() for col in df.columns]

    for idx, row in df.iterrows():
        row_dict = {str(k).strip(): str(v).strip() for k, v in row.items()}
        errors = []
        is_duplicate = False
        dup_info = None

        full_name = row_dict.get("Student Name") or row_dict.get("Full Name") or row_dict.get("full_name") or row_dict.get("Name") or ""
        parent_relation = row_dict.get("Parent / Guardian Relation") or row_dict.get("Parent Relation") or "Father"
        parent_name = row_dict.get("Parent / Guardian Name") or row_dict.get("Parent Name") or ""
        
        # Separate father, mother, guardian contacts
        father_name = row_dict.get("Father Name") or row_dict.get("Father") or ""
        father_contact = row_dict.get("Father Contact") or row_dict.get("Father Phone") or ""
        mother_name = row_dict.get("Mother Name") or row_dict.get("Mother") or ""
        mother_contact = row_dict.get("Mother Contact") or row_dict.get("Mother Phone") or ""
        guardian_name = row_dict.get("Guardian Name") or row_dict.get("Guardian") or ""
        guardian_contact = row_dict.get("Guardian Contact") or row_dict.get("Guardian Phone") or ""

        contact_number = row_dict.get("Contact Number") or row_dict.get("Phone") or row_dict.get("Primary Contact") or father_contact or mother_contact or guardian_contact or ""
        second_number = row_dict.get("Second Number") or row_dict.get("Additional Contact") or ""
        second_relation = row_dict.get("Second Number Relation") or row_dict.get("Whose Number") or "Parent"

        education_type = row_dict.get("Education Type") or "School"
        school_name = row_dict.get("School") or row_dict.get("School Name") or ""
        college_name = row_dict.get("College / University") or row_dict.get("College") or row_dict.get("University") or ""
        if college_name and college_name.lower() in ["not joined yet", "not joined", "none", "—", "-"]:
            college_name = ""

        if college_name and not school_name:
            education_type = "College / University"

        class_or_standard = row_dict.get("Class") or row_dict.get("Standard") or ""
        course_degree = row_dict.get("Course") or row_dict.get("Course / Degree") or ""
        branch_specialization = row_dict.get("Branch") or row_dict.get("Branch / Specialization") or ""
        current_year_sem = row_dict.get("Year / Semester") or row_dict.get("Current Year") or ""

        # Support "Currently Studying" label from exports/imports
        currently_studying = row_dict.get("Currently Studying") or ""
        if currently_studying and not class_or_standard and not course_degree:
            if any(term in currently_studying for term in ["—", "Year", "BE", "BTech", "Degree", "College"]):
                course_degree = currently_studying
            else:
                class_or_standard = currently_studying

        academic_year = row_dict.get("Academic Year") or "2026-27"
        passout_year_str = row_dict.get("Passout Year") or ""
        passout_school_str = row_dict.get("Passout School Year") or row_dict.get("10th Passout Year") or ""
        passout_college_str = row_dict.get("Passout College Year") or row_dict.get("College Passout Year") or ""
        education_history = row_dict.get("Education History") or row_dict.get("Milestones") or ""

        area_name = row_dict.get("Area") or ""
        address = row_dict.get("Address") or ""
        masjid = row_dict.get("Masjid") or row_dict.get("Near which Masjid?") or row_dict.get("Near Masjid") or ""
        time_spent_in_jamaat = row_dict.get("Time Spent in Jamaat") or row_dict.get("Time in Jamaat") or ""
        last_mulakhat_date = row_dict.get("Last Mulakhat Date") or row_dict.get("Mulakhat Date") or ""
        current_status = row_dict.get("Status") or "Currently Studying"
        profession = row_dict.get("Profession") or ""

        if not full_name:
            errors.append("Student Name is required.")

        passout_year = None
        if passout_year_str:
            try:
                passout_year = int(float(passout_year_str))
            except ValueError:
                errors.append("Passout Year must be a 4-digit year.")

        passout_school_year = None
        if passout_school_str:
            try:
                passout_school_year = int(float(passout_school_str))
            except ValueError:
                pass

        passout_college_year = None
        if passout_college_str:
            try:
                passout_college_year = int(float(passout_college_str))
            except ValueError:
                pass

        # Duplicate check
        if full_name:
            existing = db.query(Student).filter(Student.full_name.ilike(full_name)).first()
            if existing:
                is_duplicate = True
                dup_info = f"Matches existing student ID {existing.student_id} ({existing.full_name})"

        parsed_data = {
            "full_name": full_name,
            "parent_guardian_relation": parent_relation,
            "parent_guardian_name": parent_name,
            "father_name": father_name,
            "father_contact": father_contact,
            "mother_name": mother_name,
            "mother_contact": mother_contact,
            "guardian_name": guardian_name,
            "guardian_contact": guardian_contact,
            "contact_number": contact_number,
            "second_number": second_number,
            "second_number_relation": second_relation,
            "education_type": education_type,
            "school_id": schools.get(school_name.lower()) if school_name else None,
            "college_id": colleges.get(college_name.lower()) if college_name else None,
            "school_name": school_name,
            "college_name": college_name,
            "class_or_standard": class_or_standard,
            "course_degree": course_degree,
            "branch_specialization": branch_specialization,
            "current_year_sem": current_year_sem,
            "academic_year": academic_year,
            "passout_year": passout_year,
            "passout_school_year": passout_school_year,
            "passout_college_year": passout_college_year,
            "education_history": education_history,
            "area_id": areas.get(area_name.lower()) if area_name else None,
            "area_name": area_name,
            "address": address,
            "near_masjid": masjid,
            "masjid": masjid,
            "time_spent_in_jamaat": time_spent_in_jamaat,
            "time_in_jamaat": time_spent_in_jamaat,
            "last_mulakhat_date": last_mulakhat_date.strip() if last_mulakhat_date else None,
            "current_status": current_status,
            "profession": profession,
        }

        status_type = "invalid" if errors else ("duplicate" if is_duplicate else "valid")
        if errors:
            invalid_count += 1
        elif is_duplicate:
            duplicate_count += 1
        else:
            valid_count += 1

        preview_rows.append(ImportRowResult(
            row_number=idx + 1,
            data=parsed_data,
            status=status_type,
            errors=errors,
            duplicate_info=dup_info
        ))

    return ImportPreviewResponse(
        total_rows=len(df),
        valid_count=valid_count,
        invalid_count=invalid_count,
        duplicate_count=duplicate_count,
        preview_rows=preview_rows,
        column_headers=headers
    )

@router.post("/import/commit")
def commit_import(
    payload: ImportCommitRequest,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Data Manager"])),
    db: Session = Depends(get_db)
):
    imported_count = 0
    for row in payload.rows:
        if not row.get("full_name"):
            continue

        student_id = generate_student_id(db)

        school_id = row.get("school_id")
        if not school_id and row.get("school_name"):
            sch = db.query(School).filter(School.school_name.ilike(row["school_name"].strip())).first()
            if sch:
                school_id = sch.id

        college_id = row.get("college_id")
        if not college_id and row.get("college_name"):
            col = db.query(College).filter(College.college_name.ilike(row["college_name"].strip())).first()
            if col:
                college_id = col.id

        area_id = row.get("area_id")
        if not area_id and row.get("area_name"):
            ar = db.query(Area).filter(Area.area_name.ilike(row["area_name"].strip())).first()
            if ar:
                area_id = ar.id

        masjid_val = row.get("masjid", "").strip() or row.get("near_masjid", "").strip() or None
        jamaat_val = row.get("time_spent_in_jamaat", "").strip() or row.get("time_in_jamaat", "").strip() or None
        contact_num = row.get("contact_number", "").strip() or row.get("father_contact", "").strip() or row.get("mother_contact", "").strip() or row.get("guardian_contact", "").strip() or None
        passout_yr = row.get("passout_year") or row.get("passout_college_year") or row.get("passout_school_year")

        student = Student(
            student_id=student_id,
            full_name=row.get("full_name", "").strip(),
            parent_guardian_relation=row.get("parent_guardian_relation", "Father"),
            parent_guardian_name=row.get("parent_guardian_name", "").strip() or None,
            father_name=row.get("father_name", "").strip() or None,
            father_contact=row.get("father_contact", "").strip() or None,
            mother_name=row.get("mother_name", "").strip() or None,
            mother_contact=row.get("mother_contact", "").strip() or None,
            guardian_name=row.get("guardian_name", "").strip() or None,
            guardian_contact=row.get("guardian_contact", "").strip() or None,
            contact_number=contact_num,
            second_number=row.get("second_number", "").strip() or None,
            second_number_relation=row.get("second_number_relation", "Parent"),
            education_type=row.get("education_type", "School"),
            school_id=school_id,
            college_id=college_id,
            class_or_standard=row.get("class_or_standard", "").strip() or None,
            course_degree=row.get("course_degree", "").strip() or None,
            branch_specialization=row.get("branch_specialization", "").strip() or None,
            current_year_sem=row.get("current_year_sem", "").strip() or None,
            academic_year=row.get("academic_year", "").strip() or "2026-27",
            passout_year=passout_yr,
            passout_school_year=row.get("passout_school_year"),
            passout_college_year=row.get("passout_college_year"),
            education_history=row.get("education_history", "").strip() or None,
            area_id=area_id,
            address=row.get("address", "").strip() or None,
            near_masjid=masjid_val,
            masjid=masjid_val,
            time_spent_in_jamaat=jamaat_val,
            time_in_jamaat=jamaat_val,
            last_mulakhat_date=row.get("last_mulakhat_date", "").strip() or None,
            current_status=row.get("current_status", "Currently Studying"),
            profession=row.get("profession", "").strip() or None,
            created_by=current_user.username,
            updated_by=current_user.username
        )
        db.add(student)
        imported_count += 1

    db.commit()

    log_audit(
        db, current_user, "IMPORT_DATA", "Student",
        details={"records_imported": imported_count},
        request=request
    )

    return {"message": f"Successfully imported {imported_count} student records.", "count": imported_count}

@router.get("/export")
def export_students(
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    school_id: Optional[int] = None,
    college_id: Optional[int] = None,
    education_type: Optional[str] = None,
    academic_year: Optional[str] = None,
    passout_year: Optional[int] = None,
    area_id: Optional[int] = None,
    current_status: Optional[str] = None,
    q: Optional[str] = None,
    class_or_course: Optional[str] = None,
    student_ids: Optional[str] = Query(None, description="Comma-separated student IDs"),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student).outerjoin(School, Student.school_id == School.id)\
                             .outerjoin(College, Student.college_id == College.id)\
                             .outerjoin(Area, Student.area_id == Area.id)

    target_institution_name = None

    if student_ids:
        id_list = [int(i.strip()) for i in student_ids.split(",") if i.strip().isdigit()]
        if id_list:
            query = query.filter(Student.id.in_(id_list))
    else:
        if school_id:
            query = query.filter(Student.school_id == school_id)
            sch = db.query(School).filter(School.id == school_id).first()
            if sch:
                target_institution_name = sch.school_name.replace(" ", "_")
        if college_id:
            query = query.filter(Student.college_id == college_id)
            col = db.query(College).filter(College.id == college_id).first()
            if col:
                target_institution_name = col.college_name.replace(" ", "_")
        if education_type and education_type != "All":
            query = query.filter(Student.education_type == education_type)
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
                (Student.class_or_standard == class_or_course) |
                (Student.course_degree == class_or_course)
            )
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                Student.student_id.ilike(term) |
                Student.full_name.ilike(term) |
                School.school_name.ilike(term) |
                College.college_name.ilike(term) |
                Area.area_name.ilike(term)
            )

    students = query.order_by(Student.full_name).all()

    rows = []
    is_authorized = current_user.role in ["Admin", "Data Manager"]

    for s in students:
        # Determine separate father, mother, guardian contacts
        father_name = s.father_name or (s.parent_guardian_name if s.parent_guardian_relation == "Father" else "")
        mother_name = s.mother_name or (s.parent_guardian_name if s.parent_guardian_relation == "Mother" else "")
        guardian_name = s.guardian_name or (s.parent_guardian_name if s.parent_guardian_relation == "Guardian" else "")

        father_contact = s.father_contact or (s.contact_number if s.parent_guardian_relation == "Father" else "")
        mother_contact = s.mother_contact or (s.contact_number if s.parent_guardian_relation == "Mother" else "")
        guardian_contact = s.guardian_contact or (s.contact_number if s.parent_guardian_relation == "Guardian" else "")

        # Compute milestone string
        milestones = []
        if s.passout_school_year:
            milestones.append(f"{s.passout_school_year} (10th)")
        if s.passout_college_year:
            milestones.append(f"{s.passout_college_year} (College)")
        if not milestones and s.passout_year:
            if s.education_type == "School":
                milestones.append(f"{s.passout_year} (10th)")
            else:
                milestones.append(f"{s.passout_year} (College)")
        edu_milestones_str = s.education_history or (" • ".join(milestones) if milestones else (str(s.passout_year) if s.passout_year else ""))

        # Currently Studying label
        if s.current_status == "Passed Out":
            studying_str = f"Completed: {s.class_or_standard or s.course_degree or 'Passed Out'}"
        else:
            if s.education_type == "School":
                studying_str = s.class_or_standard or "School"
            else:
                studying_str = f"{s.course_degree or 'Degree'}{(' ' + s.branch_specialization) if s.branch_specialization else ''}{(' — ' + s.current_year_sem) if s.current_year_sem else ''}"

        # School and College separate
        school_val = s.school.school_name if s.school else ""
        college_val = s.college.college_name if s.college else ("Not joined yet" if (s.education_type == "School" or not s.college_id) else "")

        row = {
            "Student ID": s.student_id,
            "Student Name": s.full_name,
            "Father Name": father_name,
            "Father Contact": father_contact if is_authorized else ("••••••••••" if father_contact else ""),
            "Mother Name": mother_name,
            "Mother Contact": mother_contact if is_authorized else ("••••••••••" if mother_contact else ""),
            "Guardian Name": guardian_name,
            "Guardian Contact": guardian_contact if is_authorized else ("••••••••••" if guardian_contact else ""),
            "Parent / Guardian Relation": s.parent_guardian_relation or "Father",
            "Parent / Guardian Name": s.parent_guardian_name if is_authorized else "••••••••••",
            "Contact Number": s.contact_number if is_authorized else "••••••••••",
            "Second Number": s.second_number if is_authorized else ("••••••••••" if s.second_number else ""),
            "Second Number Relation": s.second_number_relation or "Parent",
            "School": school_val,
            "College / University": college_val,
            "School / College": (s.school.school_name if s.school else "") or (s.college.college_name if s.college else ""),
            "Education Type": s.education_type,
            "Currently Studying": studying_str,
            "Class / Course": s.class_or_standard or s.course_degree or "",
            "Branch": s.branch_specialization or "",
            "Academic Year": s.academic_year or "",
            "Passout Year": s.passout_year or "",
            "Education History": edu_milestones_str,
            "Area": s.area.area_name if s.area else "",
            "Masjid": (s.masjid or s.near_masjid or "Not Provided") if is_authorized else "Restricted",
            "Time Spent in Jamaat": (s.time_spent_in_jamaat or s.time_in_jamaat or "Not Provided") if is_authorized else "Restricted",
            "Last Mulakhat Date": s.last_mulakhat_date or "Not Provided",
            "Address": s.address or "",
            "Status": s.current_status,
            "Profession": s.profession or "",
            "Last Modified": s.updated_at.strftime("%d-%m-%Y") if s.updated_at else "",
        }

        rows.append(row)

    df = pd.DataFrame(rows)

    if target_institution_name:
        if passout_year:
            base_filename = f"{target_institution_name}_Passout_{passout_year}"
        elif academic_year:
            base_filename = f"{target_institution_name}_{academic_year}_Students"
        else:
            base_filename = f"{target_institution_name}_Students"
    else:
        if passout_year:
            base_filename = f"Anekal_Students_Passout_{passout_year}"
        elif academic_year:
            base_filename = f"Anekal_Student_Directory_{academic_year}"
        else:
            base_filename = f"Anekal_Student_Directory_{datetime.datetime.now(datetime.timezone.utc).year}"

    log_audit(
        db, current_user, "EXPORT_DATA", "Student",
        details={"format": format, "records_exported": len(students)},
        request=request
    )

    if format == "csv":
        csv_data = df.to_csv(index=False)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={base_filename}.csv"}
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name="Students", index=False)
            workbook = writer.book
            worksheet = writer.sheets["Students"]
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).map(len).max() if not df.empty else 0, len(col)) + 4
                worksheet.set_column(i, i, min(max_len, 40))
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={base_filename}.xlsx"}
        )
