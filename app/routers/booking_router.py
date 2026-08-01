from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.dependencies import get_current_user
from app.models import User, Room, RoomType, Booking, BookingStatus, Role, PricingRule, Payment, PaymentStatus
from app.schemas import BookingCreate, BookingQuoteRequest, BookingQuoteResponse, BookingOut
from app.database import get_db

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# create a new booking
@router.post("/", response_model=BookingOut)
def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.get(Room, booking.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # date period logic handling
    if booking.check_out <= booking.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

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
    current_date = booking.check_in
    while current_date < booking.check_out:
        holiday_period = db.query(PricingRule).filter(
            PricingRule.start_date <= current_date,
            PricingRule.end_date >= current_date,
        ).first()

        if holiday_period is not None:
            total_price += room_type.holiday_price
        elif current_date.weekday() in (5, 6):
            total_price += room_type.weekend_price
        else:
            total_price += room_type.weekday_price
        current_date += timedelta(days=1)

    # create booking object & commit to database
    new_booking = Booking(user_id=current_user.id, room_id=booking.room_id, check_in=booking.check_in, check_out=booking.check_out, status=BookingStatus.PENDING, total_price=total_price)
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

# preview payment price without finalizing booking creation
@router.post("/quote", response_model=BookingQuoteResponse)
def get_booking_quote(quote: BookingQuoteRequest, db: Session = Depends(get_db)):
    room = db.get(Room, quote.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if quote.check_out <= quote.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    # calculate total price based on each night
    room_type = db.get(RoomType, room.room_type_id)
    total_price = 0
    current_date = quote.check_in
    while current_date < quote.check_out:
        holiday_period = db.query(PricingRule).filter(
            PricingRule.start_date <= current_date,
            PricingRule.end_date >= current_date,
        ).first()

        if holiday_period is not None:
            total_price += room_type.holiday_price
        elif current_date.weekday() in (5, 6):
            total_price += room_type.weekend_price
        else:
            total_price += room_type.weekday_price
        current_date += timedelta(days=1)

    return BookingQuoteResponse(total_price=total_price)

# fetch all existing bookings
@router.get("/", response_model=list[BookingOut])
def get_all_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in (Role.ADMIN, Role.STAFF):
        fetch_bookings = db.query(Booking).all()
    else:
        fetch_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return fetch_bookings

# fetch booking by id
@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_id(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role not in (Role.ADMIN, Role.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return booking

# cancel an existing booking
@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # user auth edge case
    if booking.user_id != current_user.id and current_user.role not in (Role.ADMIN, Role.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")

    # cancel edge cases
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to cancel an already cancelled booking")
    elif booking.status == BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to cancel an already confirmed booking")

    # cancel payment as well when booking itself is cancelled
    booking.status = BookingStatus.CANCELLED
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment is not None and payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.FAILED

    db.commit()
    db.refresh(booking)
    return booking
