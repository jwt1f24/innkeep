from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric, Enum, func, ForeignKey
from datetime import datetime
from decimal import Decimal
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

# model for hotel rooms
class RoomType(Base):
    __tablename__ = "room_types"
    id: Mapped[int] = mapped_column(primary_key=True)
    hotel_id: Mapped[int] = mapped_column(ForeignKey("hotels.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    accommodates: Mapped[int] = mapped_column(default=1, nullable=False)

class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[int] = mapped_column(primary_key=True)
    room_type_id: Mapped[int] = mapped_column(ForeignKey("room_types.id"), nullable=False)
    room_number: Mapped[int] = mapped_column(nullable=False)

class Hotel(Base):
    __tablename__ = "hotels"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)