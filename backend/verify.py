import requests

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("Testing backend connectivity...")
    res = requests.get(f"{BASE_URL}/")
    print("Root:", res.status_code, res.json())
    assert res.status_code == 200

    # 1. Login Admin
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "Password@123"})
    assert res.status_code == 200, res.text
    admin_token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin login success")

    # 2. Login Viewer & Test contact masking
    res_v = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "viewer", "password": "Password@123"})
    assert res_v.status_code == 200
    v_token = res_v.json()["access_token"]
    v_headers = {"Authorization": f"Bearer {v_token}"}
    res_students = requests.get(f"{BASE_URL}/api/students", headers=v_headers)
    print("Students viewer res status:", res_students.status_code, res_students.text[:200])
    students_v = res_students.json()
    for item in students_v["items"]:
        if item.get("contact_number"):
            assert "••••" in item["contact_number"], f"Contact not masked: {item}"
    print(f"Viewer contact masking verified on {len(students_v['items'])} students")

    # 3. Overview metrics
    overview = requests.get(f"{BASE_URL}/api/dashboard/overview", headers=headers).json()
    print("Dashboard overview:", overview)
    assert "total_students" in overview
    assert "total_schools" in overview
    assert "total_colleges" in overview
    assert "school_students" in overview
    assert "college_students" in overview

    # 4. Charts metrics
    charts = requests.get(f"{BASE_URL}/api/dashboard/charts", headers=headers).json()
    print("Dashboard charts keys:", list(charts.keys()))
    assert "by_school" in charts
    assert "by_college" in charts
    assert "by_passout_year" in charts

    # 5. Schools detail 2-section drilldown
    schools = requests.get(f"{BASE_URL}/api/schools", headers=headers).json()
    assert len(schools) > 0
    first_sch_id = schools[0]["id"]
    sch_detail = requests.get(f"{BASE_URL}/api/schools/{first_sch_id}", headers=headers).json()
    assert "academic_years_breakdown" in sch_detail
    assert "passout_years_breakdown" in sch_detail
    assert "students" in sch_detail
    print(f"School detail for '{sch_detail['school']['school_name']}': {sch_detail['total_students']} students, {len(sch_detail['academic_years_breakdown'])} academic year buckets, {len(sch_detail['passout_years_breakdown'])} passout year buckets")

    # 6. Colleges detail 2-section drilldown
    colleges = requests.get(f"{BASE_URL}/api/colleges", headers=headers).json()
    assert len(colleges) > 0
    first_col_id = colleges[0]["id"]
    col_detail = requests.get(f"{BASE_URL}/api/colleges/{first_col_id}", headers=headers).json()
    assert "academic_years_breakdown" in col_detail
    assert "passout_years_breakdown" in col_detail
    assert "students" in col_detail
    print(f"College detail for '{col_detail['college']['college_name']}': {col_detail['total_students']} students, {len(col_detail['academic_years_breakdown'])} academic year buckets, {len(col_detail['passout_years_breakdown'])} passout year buckets")

    # 7. Profession master data test
    prof_res = requests.post(f"{BASE_URL}/api/master-data/professions", json={"profession_name": "Data Scientist"}, headers=headers)
    assert prof_res.status_code == 201 or prof_res.status_code == 200
    print("Profession creation success:", prof_res.json())

    # 8. Student Creation test with 5-step form data (Currently Studying)
    new_student = {
        "full_name": "Deepak R",
        "parent_guardian_relation": "Father",
        "parent_guardian_name": "Ramesh K",
        "contact_number": "9876543210",
        "second_number": "9123456789",
        "second_number_relation": "Parent",
        "education_type": "School",
        "school_id": first_sch_id,
        "class_or_standard": "10th",
        "academic_year": "2025-26",
        "passout_year": 2026,
        "current_status": "Currently Studying"
    }
    create_res = requests.post(f"{BASE_URL}/api/students", json=new_student, headers=headers)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    print("Created student (School) successfully:", created["student_id"], created["full_name"])

    # 9. Student Creation test with Passed Out + Profession
    passed_student = {
        "full_name": "Suhail Ahmed",
        "parent_guardian_relation": "Father",
        "parent_guardian_name": "Ahmed Hussain",
        "contact_number": "9876543211",
        "second_number_relation": "Self / Personal",
        "education_type": "College / University",
        "college_id": first_col_id,
        "course_degree": "BE",
        "branch_specialization": "Computer Science",
        "academic_year": "2022-23",
        "passout_year": 2026,
        "current_status": "Passed Out",
        "profession": "Software Engineer"
    }
    create_passed_res = requests.post(f"{BASE_URL}/api/students", json=passed_student, headers=headers)
    assert create_passed_res.status_code == 201, create_passed_res.text
    created_passed = create_passed_res.json()
    print("Created student (Passed Out) successfully:", created_passed["student_id"], created_passed["full_name"], created_passed["profession"])

    # 10. Search test
    search_res = requests.get(f"{BASE_URL}/api/students?q=Suhail", headers=headers).json()
    assert search_res["total"] >= 1
    print(f"Search by name 'Suhail' matched {search_res['total']} student(s)")

    search_contact = requests.get(f"{BASE_URL}/api/students?q=9876543211", headers=headers).json()
    assert search_contact["total"] >= 1
    print(f"Search by contact '9876543211' matched {search_contact['total']} student(s)")

    # 11. Export test
    exp_res = requests.get(f"{BASE_URL}/api/data-transfer/export?format=xlsx", headers=headers)
    assert exp_res.status_code == 200
    print(f"Export Excel size: {len(exp_res.content)} bytes")

    print("\n ALL VERIFICATIONS PASSED CLEANLY!")

if __name__ == "__main__":
    test_api()
