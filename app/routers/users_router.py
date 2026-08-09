from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, require_admin
from app.models import User, Role
from app.schemas import UserOut
from app.database import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[UserOut])
def list_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(user_id: int, role: Role, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = role
    db.commit()
    db.refresh(user)
    return user