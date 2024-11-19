from fastapi import APIRouter
from app.models.command_model import CommandRequest
from app.services.device_service import voiceToDevice 
import logging

router = APIRouter()

logger = logging.getLogger("uvicorn")

@router.post("/{device_id}/commands")
async def commandToDevice(device_id: str, request: CommandRequest):
    logger.info(f"device_id: {device_id}")
    logger.info(f"request: {request}")

    result = await voiceToDevice(request.parameters.text, request.parameters.volumn)

    return {"status": result}
