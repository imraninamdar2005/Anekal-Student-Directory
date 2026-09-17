from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import User
from app.schemas import UserOut, UserCreate, UserUpdate
from app.auth import require_role, get_password_hash
from app.audit import log_audit

router = APIRouter(prefix="/api/users", tags=["Users & Roles"])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    return db.query(User).order_by(desc(User.created_at)).all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email is already in use")

    hashed_pw = get_password_hash(payload.password)
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_pw,
        role=payload.role,
        is_active=payload.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db, current_user, "CREATE_USER", "User",
        entity_id=str(user.id),
        details={"username": user.username, "role": user.role},
        request=request
    )

    return user

@router.put("/{id}", response_model=UserOut)
def update_user(
    id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email and payload.email != user.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Email is already in use")
        user.email = payload.email

    if payload.full_name:
        user.full_name = payload.full_name
    if payload.role:
        old_role = user.role
        user.role = payload.role
        if old_role != payload.role:
            log_audit(
                db, current_user, "UPDATE_USER_ROLE", "User",
                entity_id=str(user.id),
                details={"username": user.username, "from_role": old_role, "to_role": payload.role},
                request=request
            )
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)

    return user
