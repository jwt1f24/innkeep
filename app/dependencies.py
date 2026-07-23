from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.security import decode_access_token
from app.database import get_db
from app.models import User, Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# fetch user token & id
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    decoded_token = decode_access_token(token)
    if decoded_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = int(decoded_token["sub"])
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# verify higher user role permissions
def require_staff_or_admin(user: User = Depends(get_current_user)):
    if user.role == Role.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return user

# verify admin role permissions
def require_admin(user: User = Depends(get_current_user)):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return user