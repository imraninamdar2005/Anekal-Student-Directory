import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Note, User
from app.schemas import NoteOut, NoteCreate, NoteUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/notes", tags=["Quick Notes"])

@router.get("", response_model=List[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Note).filter(Note.user_id == current_user.id).order_by(desc(Note.updated_at)).all()

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")
    if len(content) > 1500:
        raise HTTPException(status_code=400, detail="Note cannot exceed 1500 characters.")

    note = Note(
        user_id=current_user.id,
        content=content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.put("/{id}", response_model=NoteOut)
def update_note(
    id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    if note.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this note.")

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Note content cannot be empty.")
    if len(content) > 1500:
        raise HTTPException(status_code=400, detail="Note cannot exceed 1500 characters.")

    note.content = content
    note.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_note(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    if note.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this note.")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully", "id": id}
