from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, Room
from app.schemas import RoomCreate, RoomUpdate, RoomOut
from app.database import get_db

router = APIRouter(prefix="/rooms", tags=["Rooms"])

# create a new room
@router.post("/", response_model=RoomOut)
async def create_room(room: RoomCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
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
