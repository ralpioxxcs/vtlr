from fastapi import APIRouter
from app.services.device_service import control_device
from app.models.device_model import ControllRequest

router = APIRouter()

@router.post("/control")
async def control_device_endpoint(req:ControllRequest):
    result = await control_device(req.command)

    return {"status": result}
