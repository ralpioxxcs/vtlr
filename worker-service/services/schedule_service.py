import os
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCHEDULE_API_URL = os.getenv("SCHEDULE_API_URL", "http://localhost:3000")

def get_all_schedules():
    """
    Fetches all schedules from the schedule-service.
    """
    try:
        url = f"{SCHEDULE_API_URL}/v1.0/scheduler/schedule"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to get schedules from {SCHEDULE_API_URL}: {e}")
        return []
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_all_schedules: {e}")
        return []

def update_schedule(schedule_id: str, data: dict):
    """
    Updates a schedule using a PATCH request.
    """
    try:
        url = f"{SCHEDULE_API_URL}/v1.0/scheduler/schedule/{schedule_id}"
        response = requests.patch(url, json=data)
        response.raise_for_status()
        logger.info(f"Successfully updated schedule {schedule_id}")
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to update schedule {schedule_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred in update_schedule: {e}")
        return None

