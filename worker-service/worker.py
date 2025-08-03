import time
import logging
from celery import Celery
from dotenv import load_dotenv
import os
import redis

from services import tts_service, chromecast_service, schedule_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Redis client for locking
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0
)

# Celery configuration
celery_app = Celery(
    'worker',
    broker=f'redis://{os.getenv("REDIS_HOST", "localhost")}:{os.getenv("REDIS_PORT", 6379)}/0',
    backend=f'redis://{os.getenv("REDIS_HOST", "localhost")}:{os.getenv("REDIS_PORT", 6379)}/0'
)

@celery_app.task(bind=True, name='worker.execute_schedule')
def execute_schedule(self, schedule):
    action_config = schedule.get("action_config", {})
    device_id = action_config.get("deviceId")
    if not device_id:
        logger.error("No deviceId in action_config, cannot proceed.")
        return

    lock_key = f"lock:{device_id}"
    lock_acquired = redis_client.set(lock_key, "locked", nx=True, ex=300)

    if not lock_acquired:
        logger.info(f"Device {device_id} is locked. Retrying job {self.request.id} in 5 seconds.")
        raise self.retry(countdown=5)

    logger.info(f"Lock acquired for device {device_id}. Processing schedule: {schedule.get('title')}")

    logger.info(f"Processing schedule from queue: {schedule.get('title')}")
    action_config = schedule.get("action_config", {})
    action_type = action_config.get("type")
    device_id = action_config.get("deviceId")
    logger.info(f"Executing action: {action_type} on device: {device_id}")

    if not device_id:
        logger.error("No deviceId in action_config.")
        return

    try:
        if action_type == "TTS":
            text = action_config.get("text")
            media_url = tts_service.request_tts(text)
            if media_url:
                chromecast_service.play_media(device_id, media_url, "audio/mp3")
                tts_wait_time = int(os.getenv("TTS_DEFAULT_WAIT_SECONDS", 30))
                logger.info(f"Waiting {tts_wait_time} seconds for TTS to complete.")
                time.sleep(tts_wait_time)
            else:
                logger.error("Failed to get media URL from tts-service")

        elif action_type == "YOUTUBE":
            url = action_config.get("url")
            duration = action_config.get("duration", 0)
            if duration > 0:
                chromecast_service.play_youtube_url(device_id, url, duration)
                logger.info(f"Waiting {duration} seconds for YouTube playback to complete.")
                time.sleep(duration)
            else:
                logger.warning("YouTube action has no duration, not waiting.")

        if schedule.get("schedule_config", {}).get("type") == "ONE_TIME":
            logger.info(f"Deactivating one-time schedule: {schedule.get('id')}")
            schedule_service.update_schedule(schedule.get('id'), {'active': False})

    except Exception as e:
        logger.error(f"Failed to execute action {action_config}: {e}")
    finally:
        logger.info(f"Releasing lock for device {device_id}")
        redis_client.delete(lock_key)

@celery_app.task(name='worker.delete_schedule')
def delete_schedule(schedule_id):
    # This is a placeholder for any cleanup needed when a schedule is deleted.
    # For now, we just log it.
    logger.info(f"Schedule {schedule_id} deleted. No action taken in worker.")


if __name__ == "__main__":
    logger.info("Starting worker-service with Celery...")
    # To run the worker, use the command:
    # celery -A worker.celery_app worker --loglevel=info
