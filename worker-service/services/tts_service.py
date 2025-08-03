import os
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TTS_API_URL = os.getenv("TTS_API_URL", "http://localhost:4002")

def request_tts(text: str, language: str = "ko") -> str | None:
    """
    Requests TTS generation from the tts-service and returns a presigned URL.
    """
    try:
        url = f"{TTS_API_URL}/v1.0/tts"
        payload = {
            "text": text,
            "language": language,
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json().get("data", {})
        presigned_url = data.get("presignedUrl")

        if not presigned_url:
            logger.error("TTS service response did not include a presignedUrl.")
            return None
        
        logger.info(f"Received presigned URL from tts-service.")
        return presigned_url

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to request TTS from {TTS_API_URL}: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred in request_tts: {e}")
        return None
