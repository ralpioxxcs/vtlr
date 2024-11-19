from pydantic import BaseModel
from enum import Enum

class Commands(str, Enum):
  voice = "voice"

class Parameter(BaseModel):
  text: str
  language: str
  volumn: float

class CommandRequest(BaseModel):
  command: str
  parameters: Parameter