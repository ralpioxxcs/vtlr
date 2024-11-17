from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.device_controller import router as device_router

app = FastAPI(
    title="Vltr",
    description="Vtlr chromecast-service",
    redoc_url="/redoc",
    docs_url=None
)

origins = ["*"]
app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_methods=["*"]
)

app.include_router(device_router, prefix="/device", tags=["device"])
