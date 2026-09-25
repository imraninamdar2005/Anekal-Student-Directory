from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import get_db
from app.models import User
from app.schemas import UserOut, UserCreate, UserUpdate
from app.auth import require_role, get_password_hash, get_current_user
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
    if db.query(User).filter(func.lower(User.username) == payload.username.strip().lower()).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.query(User).filter(func.lower(User.email) == payload.email.strip().lower()).first():
        raise HTTPException(status_code=400, detail="Email is already in use")

    hashed_pw = get_password_hash(payload.password)
    user = User(
        username=payload.username.strip(),
        email=payload.email.strip(),
        full_name=payload.full_name.strip(),
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

@router.put("/me", response_model=UserOut)
def update_current_user_profile(
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_user(id=current_user.id, payload=payload, request=request, db=db, current_user=current_user)

@router.put("/{id}", response_model=UserOut)
def update_user(
    id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin" and current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you can only update your own profile."
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.username is not None:
        new_username = payload.username.strip()
        if not new_username:
            raise HTTPException(status_code=400, detail="Username cannot be empty.")
        if new_username.lower() != user.username.lower():
            existing = db.query(User).filter(
                User.id != id,
                func.lower(User.username) == new_username.lower()
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Username already exists. Please choose another username."
                )
            old_username = user.username
            user.username = new_username
            log_audit(
                db, current_user, "UPDATE_USERNAME", "User",
                entity_id=str(user.id),
                details={"from_username": old_username, "to_username": new_username},
                request=request
            )
        else:
            user.username = new_username

    if payload.email and payload.email != user.email:
        if db.query(User).filter(User.id != id, func.lower(User.email) == payload.email.lower()).first():
            raise HTTPException(status_code=400, detail="Email is already in use.")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name

    # Only Admin can change role or active status
    if payload.role and current_user.role == "Admin":
        old_role = user.role
        user.role = payload.role
        if old_role != payload.role:
            log_audit(
                db, current_user, "UPDATE_USER_ROLE", "User",
                entity_id=str(user.id),
                details={"username": user.username, "from_role": old_role, "to_role": payload.role},
                request=request
            )

    if payload.is_active is not None and current_user.role == "Admin":
        user.is_active = payload.is_active

    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
        log_audit(
            db, current_user, "CHANGE_PASSWORD", "User",
            entity_id=str(user.id),
            details={"username": user.username},
            request=request
        )

    db.commit()
    db.refresh(user)

    return user
