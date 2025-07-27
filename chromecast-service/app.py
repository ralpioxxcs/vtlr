from flask import Flask
from flask_cors import CORS
from routes import chromecast_routes
import queue
import threading
import logging
from services import chromecast_service

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 1. Create a thread-safe queue
job_queue = queue.Queue()

def worker():
    """Processes tasks from the job_queue."""
    while True:
        try:
            job = job_queue.get()  # This blocks until a job is available
            logging.info(f"Got job: {job}")
            
            action_type = job.get("action_type")
            
            if action_type == "YOUTUBE":
                chromecast_service.play_youtube_audio(
                    device_name=job["device_name"],
                    device_ip=job["device_ip"],
                    youtube_url=job["youtube_url"],
                    duration=job["duration"]
                )
            elif action_type == "TTS":
                chromecast_service.play_media_url(
                    device_name=job["device_name"],
                    device_ip=job["device_ip"],
                    media_url=job["media_url"],
                    content_type=job.get("content_type", "audio/mp3")
                )
            else:
                logging.error(f"Unknown action type: {action_type}")

            job_queue.task_done()
        except Exception as e:
            logging.error(f"Error processing job {job}: {e}")
            # In case of error, still mark task as done to avoid blocking
            job_queue.task_done()


# 2. Start the worker thread
threading.Thread(target=worker, daemon=True).start()
logging.info("Chromecast worker thread started.")

app = Flask(__name__)
CORS(app)

# 3. Make the queue available to the routes
app.config['JOB_QUEUE'] = job_queue

app.register_blueprint(chromecast_routes.bp)

if __name__ == '__main__':
    # Note: In production, use a proper WSGI server like Gunicorn or uWSGI
    app.run(debug=True, host='0.0.0.0', port=5000)
