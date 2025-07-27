from flask import Blueprint, request, jsonify
import uuid
import os
import logging

from services.file_service import check_file_exist_s3, upload_file_to_s3, generate_presigned_url
from services.tts_service import generate_tts, get_available_speakers

bp = Blueprint('tts', __name__, url_prefix='/v1.0/tts')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Health check
@bp.route('/health', methods=['GET'])
def hello():
  return "Hello!"


# Make new speech
@bp.route('/', methods=['POST'])
def make_speech():
  data = request.get_json()
  if not data or not data.get("text"):
    return jsonify({"error": "text field is required"}), 400

  text = data["text"]
  language = data.get("language", "ko")
  speaker = data.get("speaker")

  playId = str(uuid.uuid4())
  logger.info(f"Handling speech request (playId: {playId}, text: '{text}')")

  bucket_name = 'vtlr-dev-tts-speech'
  object_name = os.path.join(playId, 'tts.wav')

  presigned_url = None
  if check_file_exist_s3(bucket_name, object_name):
    logger.info(
        f"File already exists for playId {playId}. Generating new presigned URL."
    )
    presigned_url = generate_presigned_url(bucket_name, object_name)
  else:
    if not speaker:
      speaker = 'ko-KR-Chirp3-HD-Charon'

    logger.info(f"Creating TTS with speaker: {speaker}")
    audio_config = {"pitch": 0, "bass": 0, "treble": 0, "reverb": 0}
    filepath = generate_tts("google", text, speaker, audio_config)

    if not filepath:
      return jsonify({
          "status": "error",
          "message": "Failed to generate TTS file."
      }), 500

    logger.info(f"Uploading TTS to S3 object: {object_name}")
    success = upload_file_to_s3(filepath, bucket_name, object_name)

    if success:
      logger.info("File upload successful. Generating presigned URL.")
      presigned_url = generate_presigned_url(bucket_name, object_name)
    else:
      return jsonify({
          "status": "error",
          "message": "Failed to upload TTS file to storage."
      }), 500

  if not presigned_url:
    return jsonify({
        "status": "error",
        "message": "Failed to generate presigned URL."
    }), 500

  return jsonify({
      "status": "success",
      "data": {
          "playId": playId,
          "presignedUrl": presigned_url
      }
  }), 201


# Get available speakers
@bp.route('/speakers', methods=['GET'])
def get_speakers():
  speakers = get_available_speakers()
  return jsonify({"status": "success", "data": speakers}), 200
