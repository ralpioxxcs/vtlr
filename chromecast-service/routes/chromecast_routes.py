from flask import Blueprint, request, jsonify
from models.users_device import UserDevices
from services.chromecast_service import findDevice
from utils.validators import validate_chromecast_dto

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, OperationalError

from datetime import datetime

from rq import Queue
from redis import Redis

import os

bp = Blueprint('chromecast', __name__, url_prefix='/v1.0/chromecast')

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
redis_port = os.getenv('REDIS_PORT', '6379')

redis_conn = Redis(host=redis_host, port=int(redis_port), db=0)
queue = Queue(connection=redis_conn)

database_host = os.getenv('DATABASE_HOST', '127.0.0.1')
database_port = os.getenv('DATABASE_PORT', '5432')
database_user = os.getenv('DATABASE_USER', 'user')
database_password = os.getenv('DATABASE_PASSWORD', 'password')
database_name = os.getenv('DATABASE_NAME', 'vtlr')

DATABASE_URL = f"postgresql://{database_user}:{database_password}@{database_host}:{database_port}/{database_name}"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


# Health check
@bp.route('/health', methods=['GET'])
def hello():
  return "Hello!"


# Get all devices
@bp.route('/device', methods=['GET'])
def find_all_devices():
  session = Session()

  allDevices = session.query(UserDevices).all()

  result = []

  for device in allDevices:
    result.append({
        "deviceId": device.id,
        "name": device.device_name,
        "ip": device.ip_address,
    })

  session.close()

  return jsonify({"status": "success", "data": result}), 200


# Claim device
@bp.route('/device', methods=['POST'])
def claim_device():
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  newDevice = UserDevices(
      user_id=data["user_id"],
      device_name=data["device_name"],
      ip_address=data["ip_address"],
  )

  info = findDevice(data["device_name"], data["ip_address"])

  try:
    newDevice.model = info["model"]
    newDevice.manufacturer = info["manufacturer"]
    newDevice.last_communication = datetime.now()

    session.add(newDevice)
    session.commit()
  except IntegrityError:
    session.rollback()
    return jsonify({
        "status": "error",
        "message": "Integrity constraint violated"
    }), 500
  except OperationalError:
    session.rollback()
    return jsonify({
        "status": "error",
        "message": "Database operation failed"
    }), 500
  except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500

  ret = jsonify({"status": "success", "data": newDevice.to_dict()}), 201

  session.close()

  return ret


# Unclaim device
@bp.route('/device', methods=['DELETE'])
def unclaim_device():
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  device = session.query(UserDevices).filter_by(
      device_name=data["device_name"], ip_address=data["ip_address"]).scalar()

  session.delete(device)
  session.commit()

  ret = jsonify({"message": "Device unclaimed successfully", "data": ""}), 201

  session.close()

  return ret


# Get device current connectivity
@bp.route('/device/<deviceId>', methods=['GET'])
def getDeviceConnectivity(deviceId):
  session = Session()

  device = session.query(UserDevices).filter_by(id=deviceId).scalar()
  if device is None:
    return jsonify({"status": "error", "message": "device not found"}), 404

  result = findDevice(device.device_name, device.ip_address)
  if result is None:
    return jsonify({
        "status": "success",
        "data": {
            "deviceId": deviceId,
            "isConnected": False
        }
    }), 200

  ret = jsonify({
      "status": "success",
      "data": {
          "deviceId": deviceId,
          "isConnected": True
      }
  })

  session.close()

  return ret


# Command to device
@bp.route('/device/play', methods=['POST'])
def commandToDevice():
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  deviceIds = data["deviceIds"]
  playId = data["playId"]

  print(f'deviceIds: {deviceIds}')
  print(f'playId: {playId}')

  result = []

  for deviceId in deviceIds:
    print(f'search device by id ({deviceId})')
    device = session.query(UserDevices).filter_by(id=deviceId).first()
    if device is None:
      result.append({"id": deviceId, "status": "failed"})
    else:
      try:
        job = queue.enqueue(
            "services.chromecast_service.process_chromecast_request", {
                "playId": playId,
                "device": {
                    "name": device.device_name,
                    "ip": device.ip_address,
                    "volume": device.volume / 100
                },
            })

        print(f'job is enqueued successfully (id: {job.id})')

        result.append({"id": deviceId, "status": "success"})
      except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
      finally:
        session.close()

  return jsonify({"status": "success", "data": result}), 202


# Get device configuration
@bp.route('/device/<deviceId>/configuration', methods=['GET'])
def get_device_configuration(deviceId):
  session = Session()

  device = session.query(UserDevices).filter_by(id=deviceId).scalar()
  if device is None:
    return jsonify({"status": "error", "message": "device not found"}), 404

  ret = jsonify({
      "status": "success",
      "data": {
          "deviceId": deviceId,
          "volume": device.volume
      }
  }), 200

  session.close()

  return ret


# Update device configuration
@bp.route('/device/<deviceId>/configuration', methods=['PATCH'])
def set_device_configuration(deviceId):
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  device = session.query(UserDevices).filter_by(id=deviceId).first()
  if device is None:
    return jsonify({"status": "error", "message": "device not found"}), 404

  device.volume = data["volume"]

  session.commit()

  ret = jsonify({
      "status": "success",
      "data": {
          "deviceId": deviceId,
          "volume": device.volume
      }
  }), 200

  session.close()

  return ret
