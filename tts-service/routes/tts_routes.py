from flask import Blueprint, request, jsonify
from flask import send_file

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, OperationalError

import os
from pathlib import Path

from services.file_service import uploadFileToS3
from services.tts_service import makeSpeech

bp = Blueprint('tts', __name__, url_prefix='/v1.0/tts')

redis_host=os.getenv('REDIS_HOST', '127.0.0.1')
redis_port=os.getenv('REDIS_PORT', '6379')

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

# Get all voices 
# @bp.route('/voice', methods=['GET'])
# def find_all_voices():
#     session = Session()
#
#     allDevices= session.query(DeviceConfiguration).all()
#
#     result = []
#
#     for device in allDevices:
#         result.append({
#             "deviceId": device.row_id,
#             "name": device.name,
#         })
#
#     session.close()
#
#     return jsonify({"status": "success", "data": result}), 200

# Make speech 
@bp.route('/speech', methods=['POST'])
def handleSpeech():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400


    #voice = data["voice"]
    playId = data["playId"]
    text = data["text"]

    # TODO:
    # finding TTS model correspond with voice name
    # ...

    homeDir = Path.home() 

    configPath = os.path.join(homeDir, "config.json")
    ckptPath = os.path.join(homeDir, "G.pth")

    print('create tts file...')
    filePath = makeSpeech(configPath, ckptPath, text)
    print('success to create tts file...', filePath)

    # Upload WAV file to Storage bucket
    bucketName = 'vtlr-dev-tts-speech'
    objectName = os.path.join(playId, 'tts.wav')

    success = uploadFileToS3(filePath, bucketName, objectName)
    if success:
        print("file upload successful.")
    else:
        print("file upload failed.")

    return jsonify({"status": "success", "data": success}), 200

