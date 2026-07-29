from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, Room, RoomType, Booking
from app.schemas import RoomCreate, RoomUpdate, RoomOut
from app.database import get_db

router = APIRouter(prefix="/rooms", tags=["Rooms"])

# create a new room
@router.post("/", response_model=RoomOut)
def create_room(room: RoomCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_type = db.get(RoomType, room.room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    # room number & duplicate edge case
    if room.room_number <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number must greater than 0")

    duplicate = db.query(Room).filter(Room.room_number == room.room_number).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists")

    new_room = Room(room_type_id=room.room_type_id, room_number=room.room_number)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# fetch all existing rooms
@router.get("/", response_model=list[RoomOut])
def get_all_rooms(db: Session = Depends(get_db)):
    fetch_rooms = db.query(Room).all()
    return fetch_rooms

# fetch room by id
@router.get("/{room_id}", response_model=RoomOut)
def get_room_id(room_id: int, db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room

# update an existing room
@router.put("/{room_id}", response_model=RoomOut)
def update_room(room_id: int, updated: RoomUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # room number & duplication edge case
    if updated.room_number is not None:
        if updated.room_number <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number must greater than 0")

        duplicate = db.query(Room).filter(
            Room.room_number == updated.room_number,
            Room.id != room_id
        ).first()
        if duplicate is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already exists")

        room.room_number = updated.room_number

    db.commit()
    db.refresh(room)
    return room

# delete an existing room
@router.delete("/{room_id}", response_model=RoomOut)
def delete_room(room_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # rooms with booking edge case
    has_bookings = db.query(Booking).filter(Booking.room_id == room_id).first()
    if has_bookings is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,  detail="Cannot delete a room that still has bookings")

    db.delete(room)
    db.commit()
    return room
