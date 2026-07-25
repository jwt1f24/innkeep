from fastapi import FastAPI
from app.routers.auth_router import router as auth_router
from app.routers.hotels_router import router as hotels_router
from app.routers.room_types_router import router as room_types_router
from app.routers.rooms_router import router as rooms_router
from app.routers.booking_router import router as booking_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(hotels_router)
app.include_router(room_types_router)
app.include_router(rooms_router)
app.include_router(booking_router)