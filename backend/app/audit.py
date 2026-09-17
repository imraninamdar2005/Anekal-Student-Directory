from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request
from app.models import AuditLog, User
import json

def log_audit(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[dict | str] = None,
    request: Optional[Request] = None,
):
    ip_addr = request.client.host if request and request.client else None
    details_str = json.dumps(details) if isinstance(details, dict) else (details or "")
    
    audit_entry = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else "System",
        user_role=user.role if user else "System",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details_str,
        ip_address=ip_addr,
    )
    db.add(audit_entry)
    db.commit()
