import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_token():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Password@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def get_viewer_token():
    res = client.post("/api/auth/login", json={"username": "viewer", "password": "Password@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_task1_separate_parent_guardian_contacts():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    schools = client.get("/api/schools", headers=headers).json()
    school_id = schools[0]["id"]

    # Student with Father contact only, Mother contact only, Guardian contact only, or any combination
    payload = {
        "full_name": "Tariq Ahmed Khan",
        "parent_guardian_relation": "Father",
        "parent_guardian_name": "Ahmed Khan",
        "father_name": "Ahmed Khan",
        "father_contact": "9876543210",
        "mother_name": "Ayesha Khan",
        "mother_contact": "9876543211",
        "guardian_name": "Abdul Khan",
        "guardian_contact": "9876543212",
        "contact_number": "9123456780",
        "education_type": "School",
        "school_id": school_id,
        "class_or_standard": "10th",
        "academic_year": "2025-26",
        "passout_year": 2026,
        "current_status": "Currently Studying",
    }
    create_res = client.post("/api/students", json=payload, headers=headers)
    assert create_res.status_code == 201
    created = create_res.json()
    student_id = created["id"]
    assert created["father_contact"] == "9876543210"
    assert created["mother_contact"] == "9876543211"
    assert created["guardian_contact"] == "9876543212"

    # Verify authorization protection: Viewer role gets masked contacts
    viewer_token = get_viewer_token()
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    view_res = client.get(f"/api/students/{student_id}", headers=viewer_headers)
    assert view_res.status_code == 200
    viewer_data = view_res.json()
    assert "••••" in viewer_data["father_contact"]
    assert "••••" in viewer_data["mother_contact"]
    assert "••••" in viewer_data["guardian_contact"]

def test_task2_school_and_college_separate():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    schools = client.get("/api/schools", headers=headers).json()
    colleges = client.get("/api/colleges", headers=headers).json()
    school_id = schools[0]["id"]
    college_id = colleges[0]["id"]

    # Student having BOTH school and college recorded
    payload = {
        "full_name": "Farhan Zameer",
        "contact_number": "9845112233",
        "education_type": "College / University",
        "school_id": school_id,
        "college_id": college_id,
        "course_degree": "BE",
        "branch_specialization": "CSE",
        "current_year_sem": "3rd Year",
        "academic_year": "2025-26",
        "passout_year": 2027,
        "current_status": "Currently Studying",
    }
    res = client.post("/api/students", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["school_id"] == school_id
    assert data["college_id"] == college_id
    assert data["school_name"] is not None
    assert data["college_name"] is not None

def test_task5_passout_milestones_and_history():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "full_name": "Nasreen Taj",
        "contact_number": "9845223344",
        "education_type": "College / University",
        "academic_year": "2025-26",
        "passout_year": 2028,
        "passout_school_year": 2025,
        "passout_college_year": 2028,
        "education_history": "2025 (10th) • 2028 (College)",
        "current_status": "Currently Studying",
    }
    res = client.post("/api/students", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["passout_school_year"] == 2025
    assert data["passout_college_year"] == 2028
    assert data["education_history"] == "2025 (10th) • 2028 (College)"

def test_task6_and_7_masjid_and_jamaat_voluntary():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Optional voluntary Masjid and Time Spent in Jamaat
    payload = {
        "full_name": "Ilyas Pasha",
        "contact_number": "9845334455",
        "education_type": "School",
        "academic_year": "2025-26",
        "passout_year": 2026,
        "masjid": "Masjid-e-Bilal",
        "time_spent_in_jamaat": "1–2 years",
        "current_status": "Currently Studying",
    }
    res = client.post("/api/students", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    student_id = data["id"]
    assert data["masjid"] == "Masjid-e-Bilal"
    assert data["time_spent_in_jamaat"] == "1–2 years"

    # Check Viewer privacy masking
    viewer_token = get_viewer_token()
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    view_res = client.get(f"/api/students/{student_id}", headers=viewer_headers)
    assert view_res.status_code == 200
    v_data = view_res.json()
    assert v_data["masjid"] == "Restricted"
    assert v_data["time_spent_in_jamaat"] == "Restricted"

def test_export_includes_new_columns():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/data-transfer/export?format=csv", headers=headers)
    assert res.status_code == 200
    content = res.text
    # Verify header contains new columns
    assert "Father Contact" in content
    assert "Mother Contact" in content
    assert "Guardian Contact" in content
    assert "School" in content
    assert "College / University" in content
    assert "Currently Studying" in content
    assert "Masjid" in content
    assert "Time Spent in Jamaat" in content
    assert "Last Mulakhat Date" in content

def test_last_mulakhat_date_crud_and_preservation():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create with Last Mulakhat Date
    payload = {
        "full_name": "Suhail Ahmed",
        "contact_number": "9845991122",
        "education_type": "School",
        "academic_year": "2025-26",
        "passout_year": 2026,
        "last_mulakhat_date": "2026-09-25",
        "current_status": "Currently Studying",
    }
    res = client.post("/api/students", json=payload, headers=headers)
    assert res.status_code == 201
    created = res.json()
    st_id = created["id"]
    assert created["last_mulakhat_date"] == "2026-09-25"

    # 2. Updating another field (e.g. status) does NOT automatically change last_mulakhat_date
    up_res = client.put(f"/api/students/{st_id}", json={"address": "Main Market, Anekal"}, headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["last_mulakhat_date"] == "2026-09-25"

    # 3. Explicitly update last_mulakhat_date
    up_date_res = client.put(f"/api/students/{st_id}", json={"last_mulakhat_date": "2026-09-28"}, headers=headers)
    assert up_date_res.status_code == 200
    assert up_date_res.json()["last_mulakhat_date"] == "2026-09-28"

    # 4. Clear date
    clear_res = client.put(f"/api/students/{st_id}", json={"last_mulakhat_date": ""}, headers=headers)
    assert clear_res.status_code == 200
    assert clear_res.json()["last_mulakhat_date"] is None

