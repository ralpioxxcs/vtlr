from flask import Blueprint, request, jsonify
from services.chromecast_service import process_chromecast_request
from utils.validators import validate_chromecast_dto

from rq import Queue
from redis import Redis

import os

bp = Blueprint('chromecast', __name__, url_prefix='/v1.0/chromecast')

redis_host=os.getenv('REDIS_HOST', '127.0.0.1')
redis_port=os.getenv('REDIS_PORT', '6379')

redis_conn = Redis(host=redis_host, port=int(redis_port), db=0)
queue = Queue(connection=redis_conn)

@bp.route('/', methods=['GET'])
def hello():
    return "Hello!"

@bp.route('/device/<deviceId>', methods=['POST'])
def chromecast_device(deviceId):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    error = validate_chromecast_dto(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        job = queue.enqueue(process_chromecast_request, deviceId, data)
        return jsonify({"job_id": job.id, "status": "queued"}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/device/<deviceId>', methods=['GET'])
def check_status(job_id):
    from rq.job import Job

    try:
        job = Job.fetch(job_id, connection=redis_conn)
        return jsonify({"job_id": job_id, "status": job.get_status(), "result": job.result})
    except Exception as e:
        return jsonify({"error": str(e)}), 404
