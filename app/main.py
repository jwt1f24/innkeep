from fastapi import FastAPI
from app.routers import auth_router, hotels_router, room_types_router, rooms_router, booking_router, pricing_router, payment_router

app = FastAPI()
routers = (auth_router, hotels_router, room_types_router, rooms_router, booking_router, pricing_router, payment_router)

for module in routers:
    app.include_router(module.router)