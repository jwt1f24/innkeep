from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, date
from decimal import Decimal
from app.dependencies import get_current_user
from app.models import User, Room, RoomType, Booking, BookingStatus, Role, PricingRule, Payment, PaymentStatus
from app.schemas import BookingCreate, BookingQuoteRequest, BookingQuoteResponse, BookingOut, MultiBookingRequest, MultiQuoteRequest, QuoteItemResult, MultiQuoteResponse
from app.database import get_db
from app.config import settings
import stripe

router = APIRouter(prefix="/bookings", tags=["Bookings"])
stripe.api_key = settings.stripe_secret_key

# booking price calculation
def calculate_total_price(db: Session, room_type: RoomType, check_in: date, check_out: date) -> float:
    total_price = 0
    current_date = check_in
    while current_date < check_out:
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
    return total_price

# auto check out when initial set checkout date is reached
def auto_complete(booking: Booking, db: Session):
    if booking.status == BookingStatus.CONFIRMED and date.today() >= booking.check_out:
        booking.status = BookingStatus.COMPLETED
        db.commit()
        db.refresh(booking)

# preview payment price without finalizing booking creation
@router.post("/quote", response_model=BookingQuoteResponse)
def get_booking_quote(quote: BookingQuoteRequest, db: Session = Depends(get_db)):
    room = db.get(Room, quote.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if quote.check_out <= quote.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    room_type = db.get(RoomType, room.room_type_id)
    total_price = calculate_total_price(db, room_type, quote.check_in, quote.check_out)
    return BookingQuoteResponse(total_price=total_price)

# create a new booking
@router.post("/", response_model=BookingOut)
def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.get(Room, booking.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

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

    # create booking object & commit to database
    room_type = db.get(RoomType, room.room_type_id)
    total_price = calculate_total_price(db, room_type, booking.check_in, booking.check_out)
    new_booking = Booking(
        user_id=current_user.id,
        room_id=booking.room_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        status=BookingStatus.CONFIRMED,
        total_price=total_price
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # create new payment upon confirming booking
    new_payment = Payment(
        booking_id=new_booking.id,
        amount=total_price,
        status=PaymentStatus.SUCCESS
    )
    db.add(new_payment)
    db.commit()
    return new_booking

# fetch all existing bookings
@router.get("/", response_model=list[BookingOut])
def get_all_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == Role.ADMIN:
        fetch_bookings = db.query(Booking).all()
    else:
        fetch_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()

    for booking in fetch_bookings:
        auto_complete(booking, db)
    return fetch_bookings

# fetch booking by id
@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_id(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    auto_complete(booking, db)
    return booking

# cancel an existing booking
@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # user auth edge case
    if booking.user_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")

    auto_complete(booking, db)

    # cancel edge cases
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only confirmed bookings can be cancelled")

    if date.today() >= booking.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel on or after check-in date")

    # cancel payment as well when booking itself is cancelled
    booking.status = BookingStatus.CANCELLED
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment is not None and payment.status == PaymentStatus.SUCCESS:
        payment.status = PaymentStatus.REFUNDED

    db.commit()
    db.refresh(booking)
    return booking

# early checkout, only allowed during the stay
@router.patch("/{booking_id}/early-checkout", response_model=BookingOut)
def early_checkout(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")

    auto_complete(booking, db)

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only confirmed bookings can check out early")

    today = date.today()
    if not (booking.check_in <= today < booking.check_out):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Early checkout is only available during your stay")

    room = db.get(Room, booking.room_id)
    room_type = db.get(RoomType, room.room_type_id)
    new_check_out = max(today, booking.check_in + timedelta(days=1))

    unstayed_amount = calculate_total_price(db, room_type, new_check_out, booking.check_out)
    penalty = unstayed_amount * Decimal("0.10")
    new_total_price = booking.total_price - unstayed_amount + penalty

    booking.check_out = new_check_out
    booking.total_price = new_total_price
    booking.status = BookingStatus.COMPLETED

    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment is not None:
        payment.amount = new_total_price

    db.commit()
    db.refresh(booking)
    return booking

# helper for refund call
def refund_and_reject(payment_intent_id: str, status_code: int, detail: str):
    stripe.Refund.create(payment_intent=payment_intent_id)
    raise HTTPException(status_code=status_code, detail=f"{detail} Your payment has been refunded.")

# fetch available rooms when user is booking
@router.post("/multi", response_model=list[BookingOut])
def create_multi_booking(request: MultiBookingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if request.check_out <= request.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    if request.check_in < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check in date cannot be in the past")

    assignments = []
    for item in request.items:
        room_type = db.get(RoomType, item.room_type_id)
        if room_type is None:
            refund_and_reject(request.payment_intent_id, status.HTTP_404_NOT_FOUND, f"Room type {item.room_type_id} not found.")

        all_rooms = db.query(Room).filter(Room.room_type_id == item.room_type_id).all()
        available_rooms = []
        for room in all_rooms:
            conflict = db.query(Booking).filter(
                Booking.room_id == room.id,
                Booking.status != BookingStatus.CANCELLED,
                Booking.check_in < request.check_out,
                Booking.check_out > request.check_in
            ).first()
            if conflict is None:
                available_rooms.append(room)

        if len(available_rooms) < item.quantity:
            refund_and_reject(
                request.payment_intent_id,
                status.HTTP_409_CONFLICT,
                f"Only {len(available_rooms)} room(s) available for {room_type.name}."
            )

        for room in available_rooms[:item.quantity]:
            assignments.append((room, room_type))

    # create all bookings & payments once validated
    created_bookings = []
    for room, room_type in assignments:
        total_price = calculate_total_price(db, room_type, request.check_in, request.check_out)

        new_booking = Booking(
            user_id=current_user.id,
            room_id=room.id,
            check_in=request.check_in,
            check_out=request.check_out,
            status=BookingStatus.CONFIRMED,
            total_price=total_price
        )
        db.add(new_booking)
        db.flush()

        new_payment = Payment(
            booking_id=new_booking.id,
            amount=total_price,
            status=PaymentStatus.SUCCESS
        )
        db.add(new_payment)
        created_bookings.append(new_booking)

    db.commit()
    for b in created_bookings:
        db.refresh(b)
    return created_bookings

# preview total price in cart
@router.post("/quote-multi", response_model=MultiQuoteResponse)
def get_multi_quote(request: MultiQuoteRequest, db: Session = Depends(get_db)):
    if request.check_out <= request.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    if request.check_in < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check in date cannot be in the past")

    results = []
    grand_total = 0

    for item in request.items:
        room_type = db.get(RoomType, item.room_type_id)
        if room_type is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room type {item.room_type_id} not found")

        price_per_room = calculate_total_price(db, room_type, request.check_in, request.check_out)
        subtotal = price_per_room * item.quantity
        grand_total += subtotal

        results.append(QuoteItemResult(
            room_type_id=item.room_type_id,
            quantity=item.quantity,
            price_per_room=price_per_room,
            subtotal=subtotal
        ))
    return MultiQuoteResponse(items=results, grand_total=grand_total)
