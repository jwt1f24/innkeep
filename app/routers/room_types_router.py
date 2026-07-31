from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, RoomType, Room
from app.schemas import RoomTypeCreate, RoomTypeUpdate, RoomTypeOut
from app.database import get_db

router = APIRouter(prefix="/room-types", tags=["Room Types"])

# create a new room type
@router.post("/", response_model=RoomTypeOut)
def create_room_type(room_type: RoomTypeCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # input edge case
    if not room_type.name.strip() or not room_type.description.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name & description cannot be empty")

    if room_type.single_beds < 0 or room_type.king_beds < 0 or room_type.queen_beds < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bed count")

    if room_type.single_beds > 3 or room_type.king_beds > 3 or room_type.queen_beds > 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many beds")

    if room_type.weekday_price <= 0 or room_type.weekend_price <= 0 or room_type.holiday_price <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prices must be greater than zero")

    if room_type.accommodates < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accommodates must be at least 1")

    # prevent duplicate room types at the same hotel
    duplicate = db.query(RoomType).filter(RoomType.name == room_type.name).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room type already exists")

    new_type = RoomType(
        name=room_type.name,
        description=room_type.description,
        single_beds=room_type.single_beds,
        king_beds=room_type.king_beds,
        queen_beds=room_type.queen_beds,
        weekday_price=room_type.weekday_price,
        weekend_price=room_type.weekend_price,
        holiday_price=room_type.holiday_price,
        accommodates=room_type.accommodates
    )
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

# fetch all existing room types
@router.get("/", response_model=list[RoomTypeOut])
def get_all_room_types(db: Session = Depends(get_db)):
    fetch_types = db.query(RoomType).all()
    return fetch_types

# fetch room type by id
@router.get("/{room_type_id}", response_model=RoomTypeOut)
def get_room_type_id(room_type_id: int, db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")
    return room_type

# update an existing room type
@router.put("/{room_type_id}", response_model=RoomTypeOut)
def update_room_type(room_type_id: int, updated: RoomTypeUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    # optional & empty input edge case
    if updated.name is not None:
        if not updated.name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")
        room_type.name = updated.name

    if updated.description is not None:
        if not updated.description.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Description cannot be empty")
        room_type.description = updated.description

    for bed in ("single_beds", "king_beds", "queen_beds"):
        value = getattr(updated, bed)
        if value is not None:
            if value < 0 or value > 3:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bed count must be between 0 and 3")
            setattr(room_type, bed, value)

    for price in ("weekday_price", "weekend_price", "holiday_price"):
        value = getattr(updated, price)
        if value is not None:
            if value <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must be greater than 0")
            setattr(room_type, price, value)

    if updated.accommodates is not None:
        if updated.accommodates < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accommodates must have at least 1")
        room_type.accommodates = updated.accommodates

    db.commit()
    db.refresh(room_type)
    return room_type

# delete an existing room type
@router.delete("/{room_type_id}", response_model=RoomTypeOut)
def delete_room_type(room_type_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
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
