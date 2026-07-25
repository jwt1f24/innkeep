from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, RoomType
from app.schemas import RoomTypeCreate, RoomTypeUpdate, RoomTypeOut
from app.database import get_db

router = APIRouter(prefix="/room-types", tags=["Room Types"])

# create a new room type
@router.post("/", response_model=RoomTypeOut)
async def create_room_type(room_type: RoomTypeCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_type = RoomType(hotel_id=room_type.hotel_id, name=room_type.name, base_price=room_type.base_price, accommodates=room_type.accommodates)
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

    if updated.name is not None:
        room_type.name = updated.name
    if updated.base_price is not None:
        room_type.base_price = updated.base_price
    if updated.accommodates is not None:
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

    db.delete(room_type)
    db.commit()
    return room_type
