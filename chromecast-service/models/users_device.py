from sqlalchemy import (Column, String, Integer, TIMESTAMP, UUID, func, text)
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class UserDevices(Base):
  __tablename__ = 'user_devices'
  __table_args__ = {'schema': 'vtlr'}

  id = Column(UUID(as_uuid=True),
              primary_key=True,
              default=uuid.uuid4,
              server_default=text("uuid_generate_v4()"))
  user_id = Column(UUID(as_uuid=True), nullable=False)
  device_name = Column(String(64), nullable=False)
  ip_address = Column(String(45), nullable=False)
  mac_address = Column(String(17), nullable=True)
  manufacturer = Column(String(32), nullable=True)
  model = Column(String(32), nullable=True)
  volume = Column(Integer,
                  nullable=False,
                  default=50,
                  server_default=text("50"))
  last_communication = Column(TIMESTAMP(timezone=True), nullable=True)
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
        'device_name': self.device_name,
        'ip_address': self.ip_address,
        'mac_address': self.mac_address,
        'manufacturer': self.manufacturer,
        'model': self.model,
        'volumne': self.volume,
        'last_communication': self.last_communication
    }
