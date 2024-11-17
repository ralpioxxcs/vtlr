from pydantic import BaseModel

class ControllRequest(BaseModel):
  command: str