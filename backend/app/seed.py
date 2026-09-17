import random
from app.database import SessionLocal, engine, Base
from app.models import User, School, College, AcademicYear, Area, Student, AuditLog
from app.auth import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding Users...")
    users_data = [
        User(
            username="admin",
            email="admin@anekal.org",
            full_name="Anekal System Administrator",
            hashed_password=get_password_hash("Password@123"),
            role="Admin",
            is_active=True
        ),
        User(
            username="datamanager",
            email="manager@anekal.org",
            full_name="Community Data Manager",
            hashed_password=get_password_hash("Password@123"),
            role="Data Manager",
            is_active=True
        ),
        User(
            username="viewer",
            email="viewer@anekal.org",
            full_name="Community Viewer",
            hashed_password=get_password_hash("Password@123"),
            role="Viewer",
            is_active=True
        )
    ]
    db.add_all(users_data)
    db.commit()

    print("Seeding Dynamic Academic Years...")
    academic_years = [
        "2024-25", "2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31"
    ]
    for ay in academic_years:
        db.add(AcademicYear(year_label=ay, is_current=(ay == "2026-27"), is_active=True))
    db.commit()

    print("Seeding 10 Fictional Schools...")
    schools_data = [
        School(school_name="Anekal Model Public School", locality="Anekal Town"),
        School(school_name="Chandapura Vidya Mandir", locality="Chandapura"),
        School(school_name="Sarjapura High School", locality="Sarjapura"),
        School(school_name="Jigani Central Academy", locality="Jigani"),
        School(school_name="Attibele Town School", locality="Attibele"),
        School(school_name="Bannerghatta Heritage Academy", locality="Bannerghatta"),
        School(school_name="Dommasandra National School", locality="Dommasandra"),
        School(school_name="Huskur Valley Primary & High School", locality="Huskur"),
        School(school_name="Marsur Green Academy", locality="Marsur"),
        School(school_name="Heelalige Progressive School", locality="Heelalige"),
    ]
    db.add_all(schools_data)
    db.commit()

    print("Seeding 5 Fictional Colleges/Universities...")
    colleges_data = [
        College(college_name="Anekal Institute of Technology", locality="Anekal Town"),
        College(college_name="Alliance University Anekal Campus", locality="Chandapura"),
        College(college_name="Jigani College of Commerce & Science", locality="Jigani"),
        College(college_name="Attibele Polytechnic Diploma Institute", locality="Attibele"),
        College(college_name="Silicon City University", locality="Sarjapura"),
    ]
    db.add_all(colleges_data)
    db.commit()

    print("Seeding 10 Fictional Areas (without PIN code)...")
    areas_dict = [
        {"name": "Anekal Town", "desc": "Central municipal town and administrative center"},
        {"name": "Chandapura", "desc": "Commercial and residential junction on Hosur Road"},
        {"name": "Jigani Industrial Area", "desc": "Industrial belt and suburban neighborhood"},
        {"name": "Attibele", "desc": "Border town near Karnataka-Tamil Nadu boundary"},
        {"name": "Sarjapura", "desc": "Educational and residential hub in northeast taluk"},
        {"name": "Bannerghatta", "desc": "National park region and south peri-urban zone"},
        {"name": "Dommasandra", "desc": "Residential circle near Sarjapura border"},
        {"name": "Huskur", "desc": "Growing village and residential zone"},
        {"name": "Heelalige", "desc": "Railway connectivity and agrarian village"},
        {"name": "Marsur", "desc": "Suburban layout and highway residential sector"},
    ]
    for a in areas_dict:
        db.add(Area(area_name=a["name"], description=a["desc"], is_active=True))
    db.commit()

    all_schools = db.query(School).all()
    all_colleges = db.query(College).all()
    all_areas = db.query(Area).all()

    first_names = [
        "Aarav", "Aditi", "Ahmed", "Akhil", "Ananya", "Arjun", "Bhavana", "Chetan", "Deepika", 
        "Darshan", "Divya", "Faizan", "Ganesh", "Harish", "Ishaan", "Jyothi", "Kavya", "Karthik",
        "Laxmi", "Manoj", "Megha", "Mohammed", "Naveen", "Nandini", "Pooja", "Prashanth", "Praveen",
        "Rahul", "Rakshitha", "Ramesh", "Rizwan", "Roopa", "Sachin", "Sahana", "Sanjay", "Shilpa",
        "Siddharth", "Sindhu", "Sneha", "Sowmya", "Sujay", "Sunil", "Suresh", "Swathi", "Syed",
        "Tanvi", "Tejas", "Umesh", "Varun", "Zoya"
    ]

    last_names = [
        "Khan", "Gowda", "Reddy", "Murthy", "Kumar", "Sharma", "Patil", "Rao", "Hegde",
        "Shetty", "Deshmukh", "Naik", "Bhat", "Prasad", "Kulkarni", "Joshi", "Iyengar", "Ali"
    ]

    parent_first_names = ["Ramesh", "Suresh", "Ibrahim", "Manjunath", "Krishnappa", "Anand", "Narayana", "Farooq", "Raghavendra", "Venkatesh"]
    parent_relations = ["Father", "Mother", "Guardian", "Father", "Father"]
    second_relations = ["Parent", "Guardian", "Alternate Contact"]
    masjids = ["Anekal Jamia Masjid", "Chandapura Town Masjid", "Jigani Noorani Masjid", "Sarjapura Old Masjid", None, None, None]
    professions = ["Software Engineer", "Teacher", "Business", "Government Job", "Student", "Other"]

    print("Seeding 50 Fictional Students with ANL-0001 format and clean schema...")
    students_list = []
    for i in range(50):
        fn = first_names[i % len(first_names)]
        ln = last_names[i % len(last_names)]
        full_name = f"{fn} {ln}"
        student_id = f"ANL-{(i + 1):04d}"
        
        area_obj = random.choice(all_areas)
        p_rel = parent_relations[i % len(parent_relations)]
        p_name = f"{parent_first_names[i % len(parent_first_names)]} {ln}"
        contact_num = f"98{random.randint(10000000, 99999999)}"
        sec_num = f"94{random.randint(10000000, 99999999)}" if i % 2 == 0 else None
        sec_rel = random.choice(second_relations) if sec_num else "Parent"
        masjid_val = random.choice(masjids)
        address_val = f"Near Main Road, {area_obj.area_name}" if i % 3 == 0 else None

        category = i % 4

        if category == 0:
            # 10th Standard School Student
            sch = random.choice(all_schools)
            st_obj = Student(
                student_id=student_id,
                full_name=full_name,
                parent_guardian_relation=p_rel,
                parent_guardian_name=p_name,
                contact_number=contact_num,
                second_number=sec_num,
                second_number_relation=sec_rel,
                education_type="School",
                school_id=sch.id,
                class_or_standard="10th",
                academic_year="2026-27",
                passout_year=2027,
                area_id=area_obj.id,
                address=address_val,
                near_masjid=masjid_val,
                current_status="Currently Studying",
                profession=None,
                created_by="admin",
                updated_by="admin"
            )
        elif category == 1:
            # Other School Class (1st - 9th)
            sch = random.choice(all_schools)
            cls_val = random.choice(["5th", "6th", "7th", "8th", "9th"])
            ay_val = random.choice(["2025-26", "2026-27"])
            passout = 2027 + (10 - int(cls_val.replace("th", "")))
            st_obj = Student(
                student_id=student_id,
                full_name=full_name,
                parent_guardian_relation=p_rel,
                parent_guardian_name=p_name,
                contact_number=contact_num,
                second_number=sec_num,
                second_number_relation=sec_rel,
                education_type="School",
                school_id=sch.id,
                class_or_standard=cls_val,
                academic_year=ay_val,
                passout_year=passout,
                area_id=area_obj.id,
                address=address_val,
                near_masjid=masjid_val,
                current_status="Currently Studying",
                profession=None,
                created_by="admin",
                updated_by="admin"
            )
        elif category == 2:
            # College Student (BE, BTech, BCA, BCom, Diploma, MBA)
            col = random.choice(all_colleges)
            degree = random.choice(["BE", "BTech", "BCA", "BCom", "BSc", "Diploma", "MBA", "MCA"])
            branch = random.choice(["Computer Science", "Mechanical", "Civil", "Finance", "Electronics", "Information Science"])
            year_sem = random.choice(["1st Year", "2nd Year", "3rd Year", "4th Year"])
            ay_val = random.choice(["2025-26", "2026-27"])
            passout = random.choice([2027, 2028, 2029])
            st_obj = Student(
                student_id=student_id,
                full_name=full_name,
                parent_guardian_relation=p_rel,
                parent_guardian_name=p_name,
                contact_number=contact_num,
                second_number=sec_num,
                second_number_relation=sec_rel,
                education_type="College / University",
                college_id=col.id,
                course_degree=degree,
                branch_specialization=branch,
                current_year_sem=year_sem,
                academic_year=ay_val,
                passout_year=passout,
                area_id=area_obj.id,
                address=address_val,
                near_masjid=masjid_val,
                current_status="Currently Studying",
                profession=None,
                created_by="admin",
                updated_by="admin"
            )
        else:
            # Passed Out Student
            col = random.choice(all_colleges)
            degree = random.choice(["BE", "BCom", "BCA", "Diploma", "BTech"])
            branch = random.choice(["Computer Science", "Finance", "Mechanical", "Civil"])
            passout = random.choice([2024, 2025, 2026])
            profession = random.choice(professions)
            st_obj = Student(
                student_id=student_id,
                full_name=full_name,
                parent_guardian_relation=p_rel,
                parent_guardian_name=p_name,
                contact_number=contact_num,
                second_number=sec_num,
                second_number_relation=sec_rel,
                education_type="College / University",
                college_id=col.id,
                course_degree=degree,
                branch_specialization=branch,
                current_year_sem="Passed Out",
                academic_year="2025-26",
                passout_year=passout,
                area_id=area_obj.id,
                address=address_val,
                near_masjid=masjid_val,
                current_status="Passed Out",
                profession=profession,
                created_by="admin",
                updated_by="admin"
            )

        students_list.append(st_obj)

    db.add_all(students_list)
    db.commit()

    db.add(AuditLog(
        username="admin",
        user_role="Admin",
        action="SEED_DATABASE",
        entity_type="System",
        details="Initial system seed with 50 fictional student records, 10 schools, 5 colleges, and 10 areas.",
        ip_address="127.0.0.1"
    ))
    db.commit()
    db.close()
    print("Database seeding completed successfully! [OK]")

if __name__ == "__main__":
    seed_database()
