from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric, Enum, func, ForeignKey, CheckConstraint
from datetime import datetime, date
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

# model for booking
class BookingStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (CheckConstraint("check_out > check_in", name="check_out"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    check_in: Mapped[date] = mapped_column(nullable=False)
    check_out: Mapped[date] = mapped_column(nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    date_created: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

# model for pricing rules
class PricingRule(Base):
    __tablename__ = "pricing_rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    room_type_id: Mapped[int] = mapped_column(ForeignKey("room_types.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(nullable=False)
    end_date: Mapped[date] = mapped_column(nullable=False)
    price_multiplier: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    fixed_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

# model for payment
class PaymentStatus(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), nullable=False)
    stripe_payment_id: Mapped[str] = mapped_column(String, nullable=True)
