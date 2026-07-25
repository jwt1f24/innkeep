from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, Hotel
from app.schemas import HotelCreate, HotelOut
from app.database import get_db

router = APIRouter(prefix="/hotels", tags=["Hotels"])

# create a new hotel
@router.post("/", response_model=HotelOut)
async def create_hotel(hotel: HotelCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_hotel = Hotel(name=hotel.name, address=hotel.address, description=hotel.description)
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    return new_hotel

# fetch all existing hotels
@router.get("/", response_model=list[HotelOut])
async def get_all_hotels(db: Session = Depends(get_db)):
    fetch_hotels = db.query(Hotel).all()
    return fetch_hotels

# fetch hotel by id
@router.get("/{hotel_id}", response_model=HotelOut)
async def get_hotel_id(hotel_id: int, db: Session = Depends(get_db)):
    hotel = db.get(Hotel, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return hotel

# update an existing hotel
@router.put("/{hotel_id}", response_model=HotelOut)
async def update_hotel(hotel_id: int, updated: HotelCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    hotel = db.get(Hotel, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    hotel.name = updated.name
    hotel.address = updated.address
    hotel.description = updated.description
    db.commit()
    db.refresh(hotel)
    return hotel

# delete an existing hotel
@router.delete("/{hotel_id}", response_model=HotelOut)
async def delete_hotel(hotel_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    hotel = db.get(Hotel, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    db.delete(hotel)
    db.commit()
    return hotel