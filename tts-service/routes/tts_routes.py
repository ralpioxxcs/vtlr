from flask import Blueprint, request, jsonify
from flask import send_file

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, OperationalError

import os
from pathlib import Path

from services.file_service import check_file_exist_s3, upload_file_to_s3
from services.tts_service import generate_tts 

import datetime

bp = Blueprint('tts', __name__, url_prefix='/v1.0/tts')

redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
redis_port = os.getenv('REDIS_PORT', '6379')

database_host = os.getenv('DATABASE_HOST', '127.0.0.1')
database_port = os.getenv('DATABASE_PORT', '5432')
database_user = os.getenv('DATABASE_USER', 'user')
database_password = os.getenv('DATABASE_PASSWORD', 'password')
database_name = os.getenv('DATABASE_NAME', 'vtlr')

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
def handle_speech():
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  playId = data["playId"]
  text = data["text"]

  print('--------------------------------------------------------------')
  print(f'{str(datetime.datetime.now())}  handle speech (playId: {playId}, text: {text})')
  print('--------------------------------------------------------------')

  # Upload WAV file to Storage bucket
  bucket_name = 'vtlr-dev-tts-speech'
  object_name = os.path.join(playId, 'tts.wav')

  if check_file_exist_s3(bucket_name, object_name):
    print(f'{str(datetime.datetime.now())} file already exists.')
    return jsonify({"status": "success", "data": True}), 200

  # TODO:
  # finding TTS model correspond with voice name
  # ...

  print(f'{str(datetime.datetime.now())} starting to create TTS..')
  filepath = generate_tts("google", text)

  print(
      f'{str(datetime.datetime.now())} starting to upload TTS (object name: {object_name})'
  )
  success = upload_file_to_s3(filepath, bucket_name, object_name)
  if success:
    print(f'{str(datetime.datetime.now())} file upload successful.')
  else:
    print(f'{str(datetime.datetime.now())} file upload failed.')

  return jsonify({"status": "success", "data": success}), 200
