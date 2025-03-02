from botocore.endpoint import uuid
from flask import Blueprint, request, jsonify
from flask import send_file

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, OperationalError

import os
from pathlib import Path

from models.users_tts import UserTTS
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
@bp.route('/health', methods=['GET'])
def hello():
  return "Hello!"


# Get all tts
@bp.route('/', methods=['GET'])
def find_all_tts():
  session = Session()

  allTTS = session.query(UserTTS).all()

  result = []

  for tts in allTTS:
    result.append({
        "ttsId": tts.id,
    })

  session.close()

  return jsonify({"status": "success", "data": result}), 200


# Make new tts
@bp.route('/', methods=['POST'])
def make_tts():
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  newTTS = UserTTS(user_id=data["user_id"], model_name=data["model"])

  try:
    session.add(newTTS)
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

  ret = jsonify({"status": "success", "data": newTTS.to_dict()}), 201

  session.close()

  return ret


# Get tts configuration
@bp.route('/<ttsId>', methods=['GET'])
def get_device_configuration(ttsId):
  session = Session()

  tts = session.query(UserTTS).filter_by(id=ttsId).scalar()
  if tts is None:
    return jsonify({"status": "error", "message": "tts not found"}), 404

  ret = jsonify({
      "status": "success",
      "data": {
          "ttsId": tts.id,
          "model_name": tts.model_name,
          "pitch": tts.pitch,
          "bass": tts.bass,
          "treble": tts.treble,
          "reverb": tts.reverb,
      }
  }), 200

  session.close()

  return ret


# Update tts configuration
@bp.route('/<ttsId>', methods=['PATCH'])
def set_device_configuration(ttsId):
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  session = Session()

  tts = session.query(UserTTS).filter_by(id=ttsId).first()
  if tts is None:
    return jsonify({"status": "error", "message": "tts not found"}), 404

  tts.pitch = data["pitch"]
  tts.bass = data["bass"]
  tts.treble = data["treble"]
  tts.reverb = data["reverb"]

  session.commit()

  ret = jsonify({
      "status": "success",
      "data": {
          "ttsId": tts.id,
          "model_name": tts.model_name,
          "pitch": tts.pitch,
          "bass": tts.bass,
          "treble": tts.treble,
          "reverb": tts.reverb,
      }
  }), 200

  session.close()

  return ret


# Make speech
@bp.route('/<ttsId>/speech', methods=['POST'])
def handle_speech(ttsId: str):
  data = request.get_json()
  if not data:
    return jsonify({"error": "Invalid or missing JSON payload"}), 400

  playId: str = ""
  if data.get("playId") is None:
    playId = str(uuid.uuid4())
  else:
    playId = data["playId"]

  text = data["text"]

  print('--------------------------------------------------------------')
  print(
      f'{str(datetime.datetime.now())}  handle speech (playId: {playId}, text: {text})'
  )
  print('--------------------------------------------------------------')

  # Upload WAV file to Storage bucket
  bucket_name = 'vtlr-dev-tts-speech'
  object_name = os.path.join(playId, 'tts.wav')

  if check_file_exist_s3(bucket_name, object_name):
    print(f'{str(datetime.datetime.now())} file already exists.')
    return jsonify({"status": "success", "data": True}), 200

  session = Session()

  # Get TTS configuration
  tts = session.query(UserTTS).filter_by(id=ttsId).scalar()
  if tts is None:
    return jsonify({"status": "error", "message": "tts not found"}), 404

  print(f'{str(datetime.datetime.now())} starting to create TTS..')
  audio_config = {
      "pitch": tts.pitch,
      "bass": tts.bass,
      "treble": tts.treble,
      "reverb": tts.reverb
  }
  filepath = generate_tts("google", text, audio_config)

  print(
      f'{str(datetime.datetime.now())} starting to upload TTS (object name: {object_name})'
  )
  success = upload_file_to_s3(filepath, bucket_name, object_name)
  if success:
    print(f'{str(datetime.datetime.now())} file upload successful.')
  else:
    print(f'{str(datetime.datetime.now())} file upload failed.')

  return jsonify({"status": "success", "data": {"playId": playId}}), 200
