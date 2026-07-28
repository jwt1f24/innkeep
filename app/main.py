from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth_router, hotels_router, room_types_router, rooms_router, booking_router, pricing_router, payment_router

app = FastAPI()

# connect middleware to backend for allowed fastapi requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routers
routers = (auth_router, hotels_router, room_types_router, rooms_router, booking_router, pricing_router, payment_router)
for module in routers:
    app.include_router(module.router)