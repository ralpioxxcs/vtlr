from flask import Blueprint, request, jsonify
from models.device_configuration import DeviceConfiguration
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

redis_host=os.getenv('REDIS_HOST', '127.0.0.1')
redis_port=os.getenv('REDIS_PORT', '6379')

redis_conn = Redis(host=redis_host, port=int(redis_port), db=0)
queue = Queue(connection=redis_conn)

database_host=os.getenv('DATABASE_HOST', '127.0.0.1')
database_port=os.getenv('DATABASE_PORT', '5432')
database_user=os.getenv('DATABASE_USER', 'user')
database_password=os.getenv('DATABASE_PASSWORD', 'password')
database_name=os.getenv('DATABASE_NAME', 'vtlr')

DATABASE_URL = f"postgresql://{database_user}:{database_password}@{database_host}:{database_port}/{database_name}"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Health check
@bp.route('/', methods=['GET'])
def hello():
    return "Hello!"

# Get all devices
@bp.route('/device', methods=['GET'])
def find_all_devices():
    session = Session()

    allDevices= session.query(DeviceConfiguration).all()

    result = []

    for device in allDevices:
        result.append({
            "deviceId": device.row_id,
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
    newDevice = DeviceConfiguration(
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
        return jsonify({"status": "error", "message": "Integrity constraint violated"}), 500
    except OperationalError:
        session.rollback()
        return jsonify({"status": "error", "message": "Database operation failed"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    session.close()

    return jsonify({"status": "success", "data": newDevice.to_dict()}), 201

# Unclaim device
@bp.route('/device', methods=['DELETE'])
def unclaim_device():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    session = Session()

    device = session.query(DeviceConfiguration).filter_by(device_name=data["device_name"], ip_address=data["ip_address"]).scalar()

    session.delete(device)
    session.commit()

    session.close()

    return jsonify({"message": "Device unclaimed successfully", "data": ""}), 201

# Get device current connectivity
@bp.route('/device/<deviceId>', methods=['GET'])
def getDeviceConnectivity(deviceId):
    session = Session()

    device = session.query(DeviceConfiguration).filter_by(row_id=deviceId).scalar()
    if device is None:
        return jsonify({"status": "error", "message": "device not found"}), 404

    result = findDevice(device.device_name, device.ip_address)
    if result is None:
        return jsonify({"status": "success", "data": {
            "deviceId": deviceId,
            "isConnected": False
        }}), 200

    session.close()

    return jsonify({"status": "success", "data": {
        "deviceId": deviceId,
        "isConnected": True
    }})

# Command to device
@bp.route('/device/<deviceId>', methods=['POST'])
def commandToDevice(deviceId):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    error = validate_chromecast_dto(data)
    if error:
        return jsonify({"error": error}), 400

    session = Session()

    device = session.query(DeviceConfiguration).one()

    # FIXME!!
    # device = session.query(DeviceConfiguration).filter_by(row_id=deviceId).first()
    # if device is None:
    #     return jsonify({"status": "error", "message": "device not found"}), 404

    #device.last_communication = datetime.now()

    try:
        job = queue.enqueue("services.chromecast_service.process_chromecast_request", {
            "device": {
                "name": device.device_name,
                "ip": device.ip_address,
            },
            "command": {
                "text": data["text"],
                "volume": device.volume / 100,
                "language": data["language"]
            }
        })
        return jsonify({"status": "success", "data": {"job_id": job.id, "status": "queued"}}), 202
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()


# Get device configuration
@bp.route('/device/<deviceId>/configuration', methods=['GET'])
def get_device_configuration(deviceId):
    session = Session()

    device = session.query(DeviceConfiguration).filter_by(row_id=deviceId).scalar()
    if device is None:
        return jsonify({"status": "error", "message": "device not found"}), 404

    session.close()

    return jsonify({"status": "success", "data": {
        "deviceId": deviceId,
        "volume": device.volume
    }}), 200

# Update device configuration
@bp.route('/device/<deviceId>/configuration', methods=['PATCH'])
def set_device_configuration(deviceId):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    session = Session()

    device = session.query(DeviceConfiguration).filter_by(row_id=deviceId).first()
    if device is None:
        return jsonify({"status": "error", "message": "device not found"}), 404

    device.volume = data["volume"]

    session.commit()

    session.close()

    return jsonify({"status": "success", "data": {
        "deviceId": deviceId,
        "volume": device.volume
    }}), 200
