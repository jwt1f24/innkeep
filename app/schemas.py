from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import Role
from datetime import datetime

# validate incoming & outgoing user data
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

# validate user login info
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# return user attributes from api
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Role
    date_created: datetime
    model_config = ConfigDict(from_attributes=True)

# return jwt token to client
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"