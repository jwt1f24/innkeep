from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from datetime import datetime, date
from decimal import Decimal
from app.models import Role, BookingStatus, PaymentStatus

# schema for users, validate incoming & outgoing user data
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        pw = password.strip()
        if not pw:
            raise ValueError("Password cannot contain only whitespaces")
        if len(pw.encode("utf-8")) > 64:
            raise ValueError("Password too long (max 64 characters)")
        return pw

# validate user login info
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# read user object attributes
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

# schema for hotel room types
class RoomTypeCreate(BaseModel):
    name: str
    description: str
    single_beds: int
    king_beds: int
    queen_beds: int
    weekday_price: Decimal
    weekend_price: Decimal
    holiday_price: Decimal
    accommodates: int

class RoomTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    single_beds: int | None = None
    king_beds: int | None = None
    queen_beds: int | None = None
    weekday_price: Decimal | None = None
    weekend_price: Decimal | None = None
    holiday_price: Decimal | None = None
    accommodates: int | None = None

class RoomTypeOut(BaseModel):
    id: int
    name: str
    description: str
    single_beds: int
    king_beds: int
    queen_beds: int
    weekday_price: Decimal
    weekend_price: Decimal
    holiday_price: Decimal
    accommodates: int
    model_config = ConfigDict(from_attributes=True)

# schema for hotel room images
class RoomImageCreate(BaseModel):
    room_type_id: int
    image_url: str

class RoomImageUpdate(BaseModel):
    image_url: str | None = None

class RoomImageOut(BaseModel):
    id: int
    room_type_id: int
    image_url: str
    model_config = ConfigDict(from_attributes=True)

# schema for hotel rooms
class RoomCreate(BaseModel):
    room_type_id: int
    room_number: int

class RoomUpdate(BaseModel):
    room_number: int | None = None

class RoomOut(BaseModel):
    id: int
    room_type_id: int
    room_number: int
    model_config = ConfigDict(from_attributes=True)

# schema for booking
class BookingCreate(BaseModel):
    room_id: int
    check_in: date
    check_out: date

class BookingOut(BaseModel):
    id: int
    user_id: int
    room_id: int
    check_in: date
    check_out: date
    status: BookingStatus
    total_price: Decimal
    date_created: datetime
    model_config = ConfigDict(from_attributes=True)

# schema for pricing rules
class PricingRuleCreate(BaseModel):
    label: str
    start_date: date
    end_date: date

class PricingRuleUpdate(BaseModel):
    label: str | None = None
    start_date: date | None = None
    end_date: date | None = None

class PricingRuleOut(BaseModel):
    id: int
    label: str
    start_date: date
    end_date: date
    model_config = ConfigDict(from_attributes=True)

# schema for payment
class PaymentCreate(BaseModel):
    booking_id: int

class PaymentOut(BaseModel):
    id: int
    booking_id: int
    amount: Decimal
    status: PaymentStatus
    stripe_payment_id: str | None = None
    model_config = ConfigDict(from_attributes=True)