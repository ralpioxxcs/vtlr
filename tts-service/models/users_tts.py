from sqlalchemy import (Column, Integer, String, TIMESTAMP, UUID, func, text)
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class UserTTS(Base):
  __tablename__ = 'user_tts'
  __table_args__ = {'schema': 'vtlr'}

  id = Column(UUID(as_uuid=True),
              primary_key=True,
              default=uuid.uuid4,
              server_default=text("uuid_generate_v4()"))
  user_id = Column(UUID(as_uuid=True), nullable=False)
  model_name = Column(String(128), nullable=True)
  pitch = Column(Integer, nullable=True, default=0)
  bass = Column(Integer, nullable=True, default=0)
  treble = Column(Integer, nullable=True, default=0)
  reverb = Column(Integer, nullable=True, default=50)
  created_at = Column(TIMESTAMP(timezone=True),
                      nullable=False,
                      server_default=func.now())
  updated_at = Column(TIMESTAMP(timezone=True),
                      nullable=False,
                      server_default=func.now(),
                      onupdate=func.now())

  def to_dict(self):
    return {
        'id': self.id,
        'user_id': self.user_id,
        'model_name': self.model_name,
        'pitch': self.pitch,
        'bass': self.bass,
        'treble': self.treble,
        'reverb': self.reverb,
    }
