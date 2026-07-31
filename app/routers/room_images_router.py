from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_admin
from app.models import User, RoomType, RoomImage
from app.schemas import RoomImageCreate, RoomImageUpdate, RoomImageOut
from app.database import get_db

router = APIRouter(prefix="/room-images", tags=["Room Images"])

# create a new room image
@router.post("/", response_model=RoomImageOut)
def create_room_image(room_image: RoomImageCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # input edge case
    room_type = db.get(RoomType, room_image.room_type_id)
    if room_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

    if not room_image.image_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image URL cannot be empty")

    new_image = RoomImage(room_type_id=room_image.room_type_id, image_url=room_image.image_url)
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image

# fetch all existing room images
@router.get("/", response_model=list[RoomImageOut])
def get_all_room_images(db: Session = Depends(get_db)):
    fetch_images = db.query(RoomImage).all()
    return fetch_images

# fetch room image by id
@router.get("/{room_image_id}", response_model=RoomImageOut)
def get_room_image_id(room_image_id: int, db: Session = Depends(get_db)):
    room_image = db.get(RoomImage, room_image_id)
    if room_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return room_image

# update an existing room image
@router.put("/{room_image_id}", response_model=RoomImageOut)
def update_room_image(room_image_id: int, updated: RoomImageUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_image = db.get(RoomImage, room_image_id)
    if room_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # image url edge case
    if updated.image_url is not None:
        if not updated.image_url.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image URL cannot be empty")
        room_image.image_url = updated.image_url

    db.commit()
    db.refresh(room_image)
    return room_image

# delete an existing room image
@router.delete("/{room_image_id}", response_model=RoomImageOut)
def delete_room_image(room_image_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    room_image = db.get(RoomImage, room_image_id)
    if room_image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    db.delete(room_image)
    db.commit()
    return room_image
