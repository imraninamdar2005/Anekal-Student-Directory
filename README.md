# 🏫 Anekal Student Directory

A full-stack, consent-based, privacy-first community directory management application for Anekal taluk.

---

## 🛡️ Privacy & Consent Architecture

* **Strictly Voluntary & Non-Scrape:** This application contains **only voluntarily provided** student and community information. Data is never scraped, inferred, or auto-classified from public/school portals.
* **Role-Based Contact Masking (RBAC):** Users in the `Viewer` role cannot see unredacted phone numbers, emails, or parent coordinates. Only authorized `Admin` and `Data Manager` roles can access contact details for legitimate community operations.
* **Optional Voluntary Community Affiliation:** Any religious or community group field is purely voluntary and optional.
* **Prohibited Data Policy:** No Aadhaar numbers, financial/banking data, student passwords, or exact residential GPS coordinates are ever stored.
* **Audit Trail:** Comprehensive audit logging tracks all additions, modifications, deletions, imports, exports, and permission changes.

---

## 🚀 Tech Stack

### Frontend
* **Next.js 14 / React 18** (App Router)
* **TypeScript**
* **Tailwind CSS** (Modern SaaS responsive dashboard styling)
* **Lucide React** (Icons)
* **Recharts** (Demographic charts and visual trends)
* **Axios** (API communication with JWT interceptors)

### Backend
* **FastAPI** (Python 3.13)
* **SQLAlchemy** (Relational ORM with indexed models)
* **Pydantic v2** (Type validation, impossible year constraints, format checks)
* **SQLite / PostgreSQL** (Clean portable relational database)
* **Python-Jose & Bcrypt** (JWT Auth & cryptographic password hashing)
* **Pandas & OpenPyXL & XlsxWriter** (Excel/CSV imports, validation previews, and role-protected exports)

---

## 🔑 Demo Accounts & Credentials

| Role | Username / Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` or `admin@anekal.org` | `Password@123` | Full access, user management, audit logs, deletion |
| **Data Manager** | `datamanager` or `manager@anekal.org` | `Password@123` | Student CRUD, import/export, schools & colleges |
| **Viewer** | `viewer` or `viewer@anekal.org` | `Password@123` | Read-only directory, contact info redacted (`••••••`) |

*(On the login screen, convenient 1-click buttons are provided to instantly populate demo credentials)*

---

## 📁 Project Structure

```
Anekal-Student-Directory/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py           # App settings & env variables
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # Normalized database models
│   │   ├── schemas.py          # Pydantic schemas & validations
│   │   ├── auth.py             # JWT token handling & RBAC
│   │   ├── audit.py            # Audit log helper
│   │   ├── seed.py             # Fictional demo data generator
│   │   ├── main.py             # FastAPI entrypoint & CORS
│   │   └── routers/
│   │       ├── auth.py         # Login & /me endpoints
│   │       ├── students.py     # Student CRUD, search, multi-filters
│   │       ├── schools.py      # School directory & drilldowns
│   │       ├── colleges.py     # College directory & drilldowns
│   │       ├── master_data.py  # Academic years, areas, bus stops
│   │       ├── import_export.py# Excel/CSV preview & export
│   │       ├── dashboard.py    # Analytics & chart metrics
│   │       ├── users.py        # Admin user management
│   │       └── audit.py        # System audit logs
│   ├── tests/
│   │   └── test_api.py         # Automated test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with AuthProvider
│   │   │   ├── page.tsx        # Redirect controller
│   │   │   ├── login/          # Login page with demo switcher
│   │   │   ├── dashboard/      # Metrics, KPIs, Recharts, recent logs
│   │   │   ├── students/       # Search, multi-filters, table, details, add, edit
│   │   │   ├── schools/        # School drilldowns (Academic/Passout years)
│   │   │   ├── colleges/       # College drilldowns (Course -> Year -> Students)
│   │   │   ├── academic-years/ # Academic year session management
│   │   │   ├── areas/          # Anekal localities & taluk divisions
│   │   │   ├── bus-stops/      # Commute bus stops & routes
│   │   │   ├── reports/        # Community analytics & chart visualizations
│   │   │   ├── import/         # Excel/CSV upload with validation preview
│   │   │   ├── export/         # Filtered Excel (.xlsx) & CSV export
│   │   │   ├── users/          # User & role management (Admin)
│   │   │   ├── audit-logs/     # Audit trails (Admin)
│   │   │   └── settings/       # Privacy policies & data dictionary
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Navbar, AppShell
│   │   │   └── ui/             # Badge, Card, Modal, etc.
│   │   └── lib/
│   │       ├── api.ts          # Axios client with JWT interceptor
│   │       └── auth-context.tsx# React Auth context
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## 🏃 How to Run the Application

### 1. Start the Backend API (FastAPI)

```bash
cd backend

# Install Python dependencies (if not already installed)
pip install -r requirements.txt

# Run database seed (Creates tables and seeds 50 fictional students, 10 schools, 5 colleges)
python -m app.seed

# Start the FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API will run at: `http://127.0.0.1:8000`  
Swagger API Documentation: `http://127.0.0.1:8000/docs`

---

### 2. Start the Frontend (Next.js)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```
Frontend Web Dashboard will be available at: **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest tests/
```

---

## ✨ Features Implemented

1. **Authentication & RBAC:** Secure JWT tokens with Admin, Data Manager, and Viewer tiers.
2. **Dashboard:** KPI cards, live chart distribution (by year, school, college, passout year, and locality).
3. **Student Directory & Global Search:** Debounced multi-attribute search across names, IDs, institutions, and areas.
4. **Simultaneous Multi-Filtering:** Filter concurrently by School, College, Academic Year, Passout Year, Area, Bus Stop, Status, and Education Type.
5. **Student Profile:** Complete 6-section profile view with audit logs and system metadata.
6. **Add / Edit Student Forms:** Multi-section forms with validation, impossible year constraints (Passout $\ge$ Admission), and automated duplicate detection.
7. **School Drilldown:** School $\rightarrow$ Academic Years $\rightarrow$ Passout Years $\rightarrow$ Students breakdown.
8. **College Drilldown:** College $\rightarrow$ Course $\rightarrow$ Academic Year $\rightarrow$ Students hierarchy.
9. **Import Wizard:** Excel (`.xlsx`) and CSV (`.csv`) upload with pre-validation preview, duplicate alerts, error count, and safe commit.
10. **Export Engine:** Filtered or complete download in Excel (`.xlsx`) or CSV format with automatic contact masking for Viewer roles.
11. **Master Data:** Comprehensive management for Schools, Colleges, Academic Years, Localities, and Bus Stops.
12. **Audit Logging:** System-wide immutable record of all data operations with user, action, timestamp, and details.
