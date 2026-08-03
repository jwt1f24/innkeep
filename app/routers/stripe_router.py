from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.dependencies import get_current_user
from app.models import User, Room, RoomType
from app.schemas import BookingQuoteRequest
from app.database import get_db
from app.config import settings
from app.routers.booking_router import calculate_total_price
import stripe

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/stripe", tags=["Stripe"])

def get_or_create_customer(user: User, db: Session) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(email=user.email, name=user.name)
    user.stripe_customer_id = customer.id
    db.commit()
    return customer.id

@router.post("/create-payment-intent")
def create_payment_intent(quote: BookingQuoteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.get(Room, quote.room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if quote.check_out <= quote.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after start date")

    if quote.check_in < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-in date cannot be in the past")

    room_type = db.get(RoomType, room.room_type_id)
    total_price = calculate_total_price(db, room_type, quote.check_in, quote.check_out)
    amount_in_cents = int(total_price * 100)
    customer_id = get_or_create_customer(current_user, db)

    intent = stripe.PaymentIntent.create(
        amount=amount_in_cents,
        currency="myr",
        customer=customer_id,
        setup_future_usage="off_session",
        metadata={"user_id": str(current_user.id), "room_id": str(quote.room_id)},
    )

    return {"client_secret": intent.client_secret, "total_price": total_price}

@router.get("/payment-methods")
def list_payment_methods(current_user: User = Depends(get_current_user)):
    if not current_user.stripe_customer_id:
        return []

    methods = stripe.PaymentMethod.list(customer=current_user.stripe_customer_id, type="card")
    return [
        {
            "id": m.id,
            "brand": m.card.brand,
            "last4": m.card.last4,
            "exp_month": m.card.exp_month,
            "exp_year": m.card.exp_year,
        }
        for m in methods.data
    ]

@router.post("/attach-payment-method")
def attach_payment_method(payment_method_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    customer_id = get_or_create_customer(current_user, db)
    stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
    return {"detail": "Card saved"}

@router.delete("/payment-methods/{payment_method_id}")
def delete_payment_method(payment_method_id: str, current_user: User = Depends(get_current_user)):
    pm = stripe.PaymentMethod.retrieve(payment_method_id)
    if pm.customer != current_user.stripe_customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your payment method")

    stripe.PaymentMethod.detach(payment_method_id)
    return {"detail": "Payment method removed"}