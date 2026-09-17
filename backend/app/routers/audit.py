from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("", response_model=dict)
def get_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))

    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [AuditLogOut.model_validate(l) for l in logs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
