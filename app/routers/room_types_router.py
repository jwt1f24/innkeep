from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, Hotel, RoomType, Room
from app.schemas import RoomTypeCreate, RoomTypeUpdate, RoomTypeOut
from app.database import get_db

router = APIRouter(prefix="/room-types", tags=["Room Types"])

# create a new room type
@router.post("/", response_model=RoomTypeOut)
async def create_room_type(room_type: RoomTypeCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # empty required input edge case
    hotel = db.get(Hotel, room_type.hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    if not room_type.name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room type name cannot be empty")

    if room_type.weekday_price <= 0 or room_type.weekend_price <= 0 or room_type.holiday_price <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prices must be greater than zero")

    if room_type.accommodates < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accommodates must be at least 1")

    # prevent duplicate room types at the same hotel
    duplicate = db.query(RoomType).filter(
        RoomType.hotel_id == room_type.hotel_id,
        RoomType.name == room_type.name,
    ).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room type already exists at this hotel")

    new_type = RoomType(hotel_id=room_type.hotel_id, name=room_type.name, weekday_price=room_type.weekday_price, weekend_price=room_type.weekend_price, holiday_price=room_type.holiday_price, accommodates=room_type.accommodates)
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

# fetch all existing room types
@router.get("/", response_model=list[RoomTypeOut])
async def get_all_room_types(db: Session = Depends(get_db)):
    fetch_types = db.query(RoomType).all()
    return fetch_types

# fetch room type by id
@router.get("/{room_type_id}", response_model=RoomTypeOut)
async def get_room_type_id(room_type_id: int, db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")
    return room_type

# update an existing room type
@router.put("/{room_type_id}", response_model=RoomTypeOut)
async def update_room_type(room_type_id: int, updated: RoomTypeUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    # optional & empty input edge case
    if updated.name is not None:
        if not updated.name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")
        room_type.name = updated.name

    if updated.weekday_price is not None:
        if updated.weekday_price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must greater than 0")
        room_type.weekday_price = updated.weekday_price

    if updated.weekend_price is not None:
        if updated.weekend_price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must greater than 0")
        room_type.weekend_price = updated.weekend_price

    if updated.holiday_price is not None:
        if updated.holiday_price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must greater than 0")
        room_type.holiday_price = updated.holiday_price

    if updated.accommodates is not None:
        if updated.accommodates < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accommodates must have at least 1")
        room_type.accommodates = updated.accommodates

    db.commit()
    db.refresh(room_type)
    return room_type

# delete an existing room type
@router.delete("/{room_type_id}", response_model=RoomTypeOut)
async def delete_room_type(room_type_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    # prevent deletion if room type has existing rooms
    has_rooms = db.query(Room).filter(Room.room_type_id == room_type_id).first()
    if has_rooms is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete a room type that still has rooms")

    db.delete(room_type)
    db.commit()
    return room_type
