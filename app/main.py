from fastapi import FastAPI
from app.auth_router import router as auth_router
from app.hotels_router import router as hotels_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(hotels_router)