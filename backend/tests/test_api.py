import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Anekal Student Directory API" in response.json()["message"]

def test_login_admin():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Admin"

def test_login_viewer():
    response = client.post("/api/auth/login", json={
        "username": "viewer",
        "password": "Password@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "Viewer"

def test_student_list_authenticated():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/students", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0

def test_viewer_contact_redaction():
    login_res = client.post("/api/auth/login", json={
        "username": "viewer",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/students", headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    for item in items:
        if item.get("contact_number"):
            assert "••••" in item["contact_number"]

def test_create_and_fetch_student():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    schools_res = client.get("/api/schools", headers=headers)
    assert schools_res.status_code == 200
    first_sch_id = schools_res.json()[0]["id"]

    payload = {
        "full_name": "Kavitha Narayanan",
        "parent_guardian_relation": "Mother",
        "parent_guardian_name": "Lakshmi N",
        "contact_number": "9845099887",
        "second_number": "9448099887",
        "second_number_relation": "Parent",
        "education_type": "School",
        "school_id": first_sch_id,
        "class_or_standard": "10th",
        "academic_year": "2025-26",
        "passout_year": 2026,
        "current_status": "Currently Studying",
    }
    response = client.post("/api/students", json=payload, headers=headers)
    assert response.status_code == 201
    created = response.json()
    assert created["full_name"] == "Kavitha Narayanan"
    assert created["student_id"].startswith("ANL-")

def test_dashboard_overview():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/dashboard/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "total_schools" in data
    assert "total_colleges" in data
    assert "school_students" in data
    assert "college_students" in data

def test_schools_and_colleges_drilldown():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    schools_res = client.get("/api/schools", headers=headers)
    assert schools_res.status_code == 200
    schools = schools_res.json()
    assert len(schools) > 0

    first_school_id = schools[0]["id"]
    school_details = client.get(f"/api/schools/{first_school_id}", headers=headers)
    assert school_details.status_code == 200
    assert "academic_years_breakdown" in school_details.json()
    assert "passout_years_breakdown" in school_details.json()

    colleges_res = client.get("/api/colleges", headers=headers)
    assert colleges_res.status_code == 200
    colleges = colleges_res.json()
    assert len(colleges) > 0

    first_college_id = colleges[0]["id"]
    college_details = client.get(f"/api/colleges/{first_college_id}", headers=headers)
    assert college_details.status_code == 200
    assert "academic_years_breakdown" in college_details.json()
    assert "passout_years_breakdown" in college_details.json()

def test_profession_master_data():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prof_res = client.post("/api/master-data/professions", json={"profession_name": "Civil Engineer"}, headers=headers)
    assert prof_res.status_code == 201 or prof_res.status_code == 200
    assert prof_res.json()["profession_name"] == "Civil Engineer"

def test_export_endpoint():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_csv = client.get("/api/data-transfer/export?format=csv", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]

    res_xlsx = client.get("/api/data-transfer/export?format=xlsx", headers=headers)
    assert res_xlsx.status_code == 200

def test_quick_notes():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Password@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create note
    create_res = client.post("/api/notes", json={"content": "Test Dashboard Quick Note"}, headers=headers)
    assert create_res.status_code == 201
    note_id = create_res.json()["id"]

    # List notes
    list_res = client.get("/api/notes", headers=headers)
    assert list_res.status_code == 200
    assert any(n["id"] == note_id for n in list_res.json())

    # Edit note
    edit_res = client.put(f"/api/notes/{note_id}", json={"content": "Updated Dashboard Quick Note"}, headers=headers)
    assert edit_res.status_code == 200
    assert edit_res.json()["content"] == "Updated Dashboard Quick Note"

    # Delete note
    del_res = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert del_res.status_code == 200
