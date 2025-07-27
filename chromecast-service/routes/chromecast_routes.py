from flask import Blueprint, request, jsonify, current_app
from models.users_device import UserDevices
from services.chromecast_service import findDevice
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import logging
from datetime import datetime

bp = Blueprint('chromecast', __name__, url_prefix='/v1.0/chromecast')

# --- Database Setup (for device management only) ---
# This part remains as device info is still stored in the DB.
database_host = os.getenv('DATABASE_HOST', '127.0.0.1')
database_port = os.getenv('DATABASE_PORT', '5432')
database_user = os.getenv('DATABASE_USER', 'user')
database_password = os.getenv('DATABASE_PASSWORD', 'password')
database_name = os.getenv('DATABASE_NAME', 'vtlr')

DATABASE_URL = f"postgresql://{database_user}:{database_password}@{database_host}:{database_port}/{database_name}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


# --- Routes ---
@bp.route('/health', methods=['GET'])
def hello():
  return "Hello from Chromecast Service!"


@bp.route('/device', methods=['GET'])
def find_all_devices():
  """Gets all registered devices from the database."""
  session = Session()
  try:
    all_devices = session.query(UserDevices).all()
    result = [{
        "deviceId": dev.id,
        "name": dev.device_name,
        "ip": dev.ip_address,
        "volume": dev.volume
    } for dev in all_devices]
    return jsonify({"status": "success", "data": result}), 200
  except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()


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


# Update device
@bp.route('/device/<deviceId>', methods=['PATCH'])
def update_device(deviceId):
  data = request.get_json()

  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  device = session.query(UserDevices).filter_by(id=deviceId).first()
  if device is None:
    return jsonify({"status": "error", "message": "device not found"}), 404

  if 'device_name' in data:
    device.device_name = data['device_name']
  if 'ip_address' in data:
    device.ip_address = data['ip_address']
  if 'volume' in data:
    device.volume = data['volume']

  try:
    session.commit()
    return jsonify({"status": "success", "data": device.to_dict()}), 200
  except Exception as e:
    session.rollback()
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()


@bp.route('/device/play', methods=['POST'])
def command_to_device():
  """Queues a request to play a generic media URL (for TTS)."""
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid JSON payload"}), 400

  # worker-service must provide all necessary info.
  device_id = data.get("deviceId")
  media_url = data.get("mediaUrl")
  content_type = data.get("contentType", "audio/mp3")

  if not all([device_id, media_url]):
    return jsonify({"error": "Missing deviceId or mediaUrl"}), 400

  # Get device info from DB
  session = Session()
  try:
    device = session.query(UserDevices).filter_by(id=device_id).first()
    if not device:
      return jsonify({"error": f"Device with ID {device_id} not found"}), 404

    job = {
        "action_type": "TTS",
        "device_name": device.device_name,
        "device_ip": device.ip_address,
        "media_url": media_url,
        "content_type": content_type,
    }

    job_queue = current_app.config['JOB_QUEUE']
    job_queue.put(job)

    return jsonify({"status": "queued", "job": job}), 202

  except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()


logger = logging.getLogger(__name__)


# ... (inside play_youtube_command function)
@bp.route('/device/play-youtube', methods=['POST'])
def play_youtube_command():
  """Queues a request to play a YouTube URL."""
  data = request.get_json()
  logger.info(f"Received /play-youtube request with data: {data}")

  if not data:
    return jsonify({"error": "Invalid JSON payload"}), 400

  device_id = data.get("deviceId")
  youtube_url = data.get("youtubeUrl")
  duration = data.get("duration", 0)

  if not all([device_id, youtube_url]):
    return jsonify({"error": "Missing deviceId or youtubeUrl"}), 400

  # Get device info from DB
  session = Session()
  try:
    device = session.query(UserDevices).filter_by(id=device_id).first()
    if not device:
      return jsonify({"error": f"Device with ID {device_id} not found"}), 404

    job = {
        "action_type": "YOUTUBE",
        "device_name": device.device_name,
        "device_ip": device.ip_address,
        "youtube_url": youtube_url,
        "duration": duration,
    }

    job_queue = current_app.config['JOB_QUEUE']
    job_queue.put(job)

    return jsonify({"status": "queued", "job": job}), 202

  except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()


@bp.route('/device', methods=['POST'])
def claim_device():
  """Claims a new device and adds it to the database."""
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()
  try:
    # Assuming user_id is provided or handled appropriately
    new_device = UserDevices(
        user_id=data.get(
            "user_id", "00000000-0000-0000-0000-000000000000"),  # Placeholder
        device_name=data["device_name"],
        ip_address=data["ip_address"],
    )

    info = findDevice(data["device_name"], data["ip_address"])
    if info:
      new_device.model = info.get("model")
      new_device.manufacturer = info.get("manufacturer")

    new_device.last_communication = datetime.now()

    session.add(new_device)
    session.commit()

    # Assuming UserDevices has a to_dict() method or similar
    return jsonify({"status": "success", "data": new_device.to_dict()}), 201

  except Exception as e:
    session.rollback()
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()


@bp.route('/device/<deviceId>', methods=['DELETE'])
def unclaim_device(deviceId):
  """Unclaims a device by deleting it from the database."""
  session = Session()
  try:
    device = session.query(UserDevices).filter_by(id=deviceId).first()
    if not device:
      return jsonify({"error": f"Device with ID {deviceId} not found"}), 404

    session.delete(device)
    session.commit()

    return jsonify({
        "status": "success",
        "message": "Device unclaimed successfully"
    }), 200

  except Exception as e:
    session.rollback()
    return jsonify({"status": "error", "message": str(e)}), 500
  finally:
    session.close()
