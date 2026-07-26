from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, Room, RoomType
from app.schemas import RoomCreate, RoomUpdate, RoomOut
from app.database import get_db

router = APIRouter(prefix="/rooms", tags=["Rooms"])

# create a new room
@router.post("/", response_model=RoomOut)
async def create_room(room: RoomCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # prevent duplicate room numbers at the same hotel
    room_type = db.get(RoomType, room.room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    existing = db.query(Room).join(RoomType, Room.room_type_id == RoomType.id).filter(
        RoomType.hotel_id == room_type.hotel_id,
        Room.room_number == room.room_number,
    ).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists at this hotel")

    new_room = Room(room_type_id=room.room_type_id, room_number=room.room_number)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# fetch all existing rooms
@router.get("/", response_model=list[RoomOut])
async def get_all_rooms(db: Session = Depends(get_db)):
    fetch_rooms = db.query(Room).all()
    return fetch_rooms

# fetch room by id
@router.get("/{room_id}", response_model=RoomOut)
async def get_room_id(room_id: int, db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room

# update an existing room
@router.put("/{room_id}", response_model=RoomOut)
async def update_room(room_id: int, updated: RoomUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if updated.room_number is not None:
        room.room_number = updated.room_number

    db.commit()
    db.refresh(room)
    return room

# delete an existing room
@router.delete("/{room_id}", response_model=RoomOut)
async def delete_room(room_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    db.delete(room)
    db.commit()
    return room
