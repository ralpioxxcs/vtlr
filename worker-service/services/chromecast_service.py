import os
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHROMECAST_API_URL = os.getenv("CHROMECAST_API_URL", "http://localhost:5000")

def play_media(device_id: str, media_url: str, content_type: str = "audio/mp3"):
    """
    Queues a request in chromecast-service to play a media URL.
    """
    try:
        url = f"{CHROMECAST_API_URL}/v1.0/chromecast/device/play"
        payload = {
            "deviceId": device_id,
            "mediaUrl": media_url,
            "contentType": content_type
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        logger.info(f"Successfully queued media playback on device {device_id}")
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to queue media playback: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred in play_media: {e}")
        return None


def play_youtube_url(device_id: str, youtube_url: str, duration: int = 0):
    """
    Requests chromecast-service to play a YouTube URL on a specific device.
    """
    try:
        url = f"{CHROMECAST_API_URL}/v1.0/chromecast/device/play-youtube"
        payload = {
            "deviceId": device_id,
            "youtubeUrl": youtube_url,
            "duration": duration,
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        logger.info(f"Successfully requested to play YouTube URL on device {device_id}")
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to request YouTube playback: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred in play_youtube_url: {e}")
        return None
