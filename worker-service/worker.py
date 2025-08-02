import time
import logging
import queue
import threading
from datetime import datetime, time as dt_time
from croniter import croniter
from dotenv import load_dotenv
import os
import pytz

from services import schedule_service, tts_service, chromecast_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Thread-safe Queue for Jobs ---
execution_queue = queue.Queue()

# --- Helper Functions ---

def is_time_to_run(schedule_config):
    """Checks if a schedule should be executed at the current time, based on KST."""
    try:
        kst = pytz.timezone('Asia/Seoul')
        now = datetime.now(kst)
        schedule_type = schedule_config.get("type")

        if schedule_type == "ONE_TIME":
            naive_run_time = datetime.fromisoformat(schedule_config.get("datetime"))
            kst_run_time = kst.localize(naive_run_time)
            return now.year == kst_run_time.year and \
                   now.month == kst_run_time.month and \
                   now.day == kst_run_time.day and \
                   now.hour == kst_run_time.hour and \
                   now.minute == kst_run_time.minute
        
        elif schedule_type == "RECURRING":
            exec_time = dt_time.fromisoformat(schedule_config.get("time"))
            if now.hour != exec_time.hour or now.minute != exec_time.minute:
                return False
            day_map = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0}
            cron_days = [str(day_map[d]) for d in schedule_config.get("days", [])]
            if not cron_days: return False
            cron_str = f"{exec_time.minute} {exec_time.hour} * * {','.join(cron_days)}"
            return croniter.is_match(cron_str, now)

        elif schedule_type == "HOURLY":
            exec_time = dt_time.fromisoformat(schedule_config.get("time"))
            return now.hour == exec_time.hour and now.minute == exec_time.minute
    except Exception as e:
        logger.error(f"Error parsing schedule config: {schedule_config}. Error: {e}")
    return False

def execute_action(action_config):
    """Sends request to execute the action and waits for it to complete."""
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
                # Wait for a fixed duration for TTS playback
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

    except Exception as e:
        logger.error(f"Failed to execute action {action_config}: {e}")

def schedule_checker():
    """Periodically checks for schedules and adds them to the execution_queue."""
    logger.info("Starting schedule checker thread...")
    while True:
        try:
            logger.info("Checking for schedules to run...")
            schedules = schedule_service.get_all_schedules()
            if schedules:
                for schedule in schedules:
                    if schedule.get("active") and is_time_to_run(schedule.get("schedule_config", {})):
                        logger.info(f"Queueing schedule: {schedule.get('title')} (ID: {schedule.get('id')})")
                        execution_queue.put(schedule)
            
            # "Smart Sleep" to synchronize with the start of the next minute
            now = datetime.now()
            seconds_to_wait = 60.0 - now.second - (now.microsecond / 1_000_000.0)
            time.sleep(seconds_to_wait)
        except Exception as e:
            logger.error(f"An error occurred in the schedule_checker loop: {e}")
            time.sleep(60)

def job_executor():
    """Executes jobs from the queue one by one, sequentially."""
    logger.info("Starting job executor thread...")
    while True:
        try:
            schedule = execution_queue.get() # This blocks until a job is available
            logger.info(f"Processing schedule from queue: {schedule.get('title')}")
            execute_action(schedule.get("action_config", {}))
            
            if schedule.get("schedule_config", {}).get("type") == "ONE_TIME":
                logger.info(f"Deactivating one-time schedule: {schedule.get('id')}")
                schedule_service.update_schedule(schedule.get('id'), {'active': False})
            
            execution_queue.task_done()
        except Exception as e:
            logger.error(f"An error occurred in the job_executor loop: {e}")

# --- Main Execution ---

if __name__ == "__main__":
    logger.info("Starting worker-service...")
    
    # Start the schedule checker in a background thread
    checker_thread = threading.Thread(target=schedule_checker, daemon=True)
    checker_thread.start()
    
    # Start the job executor in the main thread (or another background thread)
    job_executor()
