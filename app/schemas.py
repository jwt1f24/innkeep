from pydantic import BaseModel, EmailStr

# validate incoming & outgoing user data
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str