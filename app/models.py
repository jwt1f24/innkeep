from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Enum, func
from datetime import datetime
from app.database import Base
import enum

# model for users
class Role(enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    GUEST = "guest"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False)
    date_created: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)