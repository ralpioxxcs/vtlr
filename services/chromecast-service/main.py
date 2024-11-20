from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.device_controller import router as device_router
import logging

app = FastAPI(
    title="vtlr",
    description="vtlr chromecast-service",
    redoc_url="/redoc",
    docs_url=None
)

logger = logging.getLogger("uvicorn")

origins = ["*"]
app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_methods=["*"]
)

@app.on_event("startup")
def setup_logging():
    logger.info("Application startup")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.get("/health")
def health_check():
  logger.info("health check!")
  return {"status": "ok"}

app.include_router(device_router, prefix="/devices", tags=["devices"])
