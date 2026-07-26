from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, require_staff_or_admin
from app.models import User, Role, Payment, PaymentStatus, Booking, BookingStatus
from app.schemas import PaymentCreate, PaymentOut
from app.database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])

# create a new payment
@router.post("/", response_model=PaymentOut)
async def create_payment(payment: PaymentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, payment.booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # prevent payment creation for cancelled bookings
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for cancelled booking")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Booking does not belong to user")

    # reset a failed payment to pending
    existing = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if existing is not None:
        if existing.status == PaymentStatus.FAILED:
            existing.status = PaymentStatus.PENDING
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment for this booking already exists")

    new_payment = Payment(booking_id=payment.booking_id, amount=booking.total_price, status=PaymentStatus.PENDING)
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

# fetch all existing payments
@router.get("/", response_model=list[PaymentOut])
async def get_all_payments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in (Role.ADMIN, Role.STAFF):
        fetch_payments = db.query(Payment).all()
    else:
        fetch_payments = db.query(Payment).join(Booking, Payment.booking_id == Booking.id).filter(Booking.user_id == current_user.id).all()
    return fetch_payments

# fetch payment by id
@router.get("/{payment_id}", response_model=PaymentOut)
async def get_payment_id(payment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    booking = db.get(Booking, payment.booking_id)
    if booking.user_id != current_user.id and current_user.role not in (Role.ADMIN, Role.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return payment

# mark a payment as success
@router.patch("/{payment_id}/confirm", response_model=PaymentOut)
async def confirm_payment(payment_id: int, admin: User = Depends(require_staff_or_admin), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.SUCCESS
        booking = db.get(Booking, payment.booking_id)
        booking.status = BookingStatus.CONFIRMED

    db.commit()
    db.refresh(payment)
    return payment

# cancel a payment
@router.patch("/{payment_id}/fail", response_model=PaymentOut)
async def cancel_payment(payment_id: int, admin: User = Depends(require_staff_or_admin), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.FAILED

    db.commit()
    db.refresh(payment)
    return payment

# refund a payment
@router.patch("/{payment_id}/refund", response_model=PaymentOut)
async def refund_payment(payment_id: int, admin: User = Depends(require_staff_or_admin), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status == PaymentStatus.SUCCESS:
        payment.status = PaymentStatus.REFUNDED
        booking = db.get(Booking, payment.booking_id)
        booking.status = BookingStatus.CANCELLED

    db.commit()
    db.refresh(payment)
    return payment
