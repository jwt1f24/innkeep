from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.dependencies import get_current_user
from app.models import User, Room, RoomType, Booking, BookingStatus, Role, PricingRule
from app.schemas import BookingCreate, BookingOut
from app.database import get_db

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# create a new booking
@router.post("/", response_model=BookingOut)
async def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.get(Room, booking.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # prevent overlapping bookings on a specific hotel room
    conflict = db.query(Booking).filter(
        Booking.room_id == booking.room_id,
        Booking.status != BookingStatus.CANCELLED,
        Booking.check_in < booking.check_out,
        Booking.check_out > booking.check_in
    ).first()
    if conflict is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This room has been booked")

    # check price based on time period
    room_type = db.get(RoomType, room.room_type_id)
    total_price = 0
    curr = booking.check_in
    while curr < booking.check_out:
        holiday_period = db.query(PricingRule).filter(
            PricingRule.hotel_id == room_type.hotel_id,
            PricingRule.start_date <= curr,
            PricingRule.end_date >= curr,
        ).first()

        if holiday_period is not None:
            total_price += room_type.holiday_price
        elif curr.weekday() in (5, 6):
            total_price += room_type.weekend_price
        else:
            total_price += room_type.weekday_price
        curr += timedelta(days=1)

    # create booking object & commit to database
    new_booking = Booking(user_id=current_user.id, room_id=booking.room_id, check_in=booking.check_in, check_out=booking.check_out, status=BookingStatus.PENDING, total_price=total_price)
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

# fetch all existing bookings
@router.get("/", response_model=list[BookingOut])
async def get_all_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in (Role.ADMIN, Role.STAFF):
        fetch_bookings = db.query(Booking).all()
    else:
        fetch_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return fetch_bookings

# fetch booking by id
@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking_id(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role not in (Role.ADMIN, Role.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return booking

# cancel an existing booking
@router.patch("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role not in (Role.ADMIN, Role.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")

    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        return booking

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking
