from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.models import User, Role, Payment, Booking
from app.schemas import PaymentOut
from app.database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])

# fetch all existing payments
@router.get("/", response_model=list[PaymentOut])
def get_all_payments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == Role.ADMIN:
        fetch_payments = db.query(Payment).all()
    else:
        fetch_payments = db.query(Payment).join(Booking, Payment.booking_id == Booking.id).filter(Booking.user_id == current_user.id).all()
    return fetch_payments

# fetch payment by id
@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment_id(payment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    booking = db.get(Booking, payment.booking_id)
    if booking.user_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not authorized")
    return payment
