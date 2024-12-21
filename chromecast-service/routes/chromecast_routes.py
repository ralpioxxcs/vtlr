from flask import Blueprint, request, jsonify
from services.chromecast_service import process_chromecast_request
from utils.validators import validate_chromecast_dto

bp = Blueprint('chromecast', __name__, url_prefix='/v1.0/chromecast')

@bp.route('/device/<deviceId>', methods=['POST'])
def chromecast_device(deviceId):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    error = validate_chromecast_dto(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        result = process_chromecast_request(deviceId, data)
        return jsonify({"message": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
