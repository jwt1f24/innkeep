from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models import User, Role
from app.schemas import UserCreate, UserOut, Token
from app.security import hash_password, verify_password, create_access_token
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

# user registration
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    check_email = db.query(User).filter(User.email == user.email).first()
    if check_email is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = hash_password(user.password)
    create_user = User(name=user.name, email=user.email, password_hash=hashed_password, role=Role.GUEST)
    db.add(create_user)
    db.commit()
    db.refresh(create_user)
    return create_user

# user login
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token(str(user.id))
    return Token(access_token=access_token)