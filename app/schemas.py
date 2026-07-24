from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import Role, BookingStatus, PaymentStatus
from datetime import datetime, date
from decimal import Decimal

# schema for users, validate incoming & outgoing user data
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

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

# schema for hotel
class HotelCreate(BaseModel):
    name: str
    address: str
    description: str | None

class HotelOut(BaseModel):
    id: int
    name: str
    address: str
    description: str | None
    model_config = ConfigDict(from_attributes=True)

# schema for hotel rooms
class RoomTypeCreate(BaseModel):
    hotel_id: int
    name: str
    base_price: Decimal
    accommodates: int

class RoomTypeOut(BaseModel):
    id: int
    hotel_id: int
    name: str
    base_price: Decimal
    accommodates: int
    model_config = ConfigDict(from_attributes=True)

class RoomCreate(BaseModel):
    room_type_id: int
    room_number: int

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
    room_type_id: int
    start_date: date
    end_date: date
    price_multiplier: Decimal | None = None
    fixed_price: Decimal | None = None

class PricingRuleOut(BaseModel):
    id: int
    room_type_id: int
    start_date: date
    end_date: date
    price_multiplier: Decimal | None = None
    fixed_price: Decimal | None = None
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