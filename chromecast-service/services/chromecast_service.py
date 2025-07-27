import pychromecast
from pytubefix import YouTube
from pytubefix.cli import on_progress
import time
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def findDevice(name:str, ip:str):
    # This function might not be needed anymore if all calls go through the queue
    # but we'll keep it for now.
    try:
        casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[name], known_hosts=[ip])
        if not casts:
            logging.warning(f"Chromecast '{name}' not found at {ip}")
            return None
        cast = casts[0]
        cast.wait()
        return {
            "model": cast.model_name,
            "manufacturer": cast.cast_info.manufacturer
        }
    except Exception as e:
        logging.error(f"Error finding device {name}: {e}")
        return None

def play_media_url(device_name: str, device_ip: str, media_url: str, content_type: str = "audio/mp3"):
    """Plays a media from a URL."""
    logging.info(f"Attempting to play media URL {media_url} on {device_name}")
    try:
        casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[device_name], known_hosts=[device_ip])
        if not casts:
            raise Exception(f"Device '{device_name}' not found.")

        cast = casts[0]
        cast.wait()

        mc = cast.media_controller
        mc.play_media(media_url, content_type)
        mc.block_until_active()
        logging.info(f"Playback started on {device_name}.")
        
        # For generic media, we don't have a duration, so it plays until the end.
        # The original implementation had a stop_event, which is a good idea for long-running tasks
        # but for now, we'll let it play out.

        return {"status": "success", "message": f"Playing media on {device_name}."}
    except Exception as e:
        logging.error(f"Failed to play media on {device_name}: {e}")
        return {"status": "error", "message": str(e)}


def play_youtube_audio(device_name: str, device_ip: str, youtube_url: str, duration: int):
    """Plays audio from a YouTube URL for a specific duration."""
    logging.info(f"Attempting to play YouTube URL {youtube_url} on {device_name} for {duration}s")
    try:
        casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[device_name], known_hosts=[device_ip])
        if not casts:
            raise Exception(f"Device '{device_name}' not found.")

        cast = casts[0]
        cast.wait()

        yt = YouTube(youtube_url)
        audio_stream = yt.streams.filter(only_audio=True).first()
        if not audio_stream:
            raise Exception("No audio stream found for the YouTube URL.")

        mc = cast.media_controller
        mc.play_media(audio_stream.url, 'audio/mp4')
        mc.block_until_active()
        logging.info(f"YouTube playback started on {device_name}.")

        if duration > 0:
            def stop_playback():
                logging.info(f"Playback on {device_name} will stop in {duration} seconds.")
                time.sleep(duration)
                try:
                    mc.stop()
                    cast.quit_app()
                    logging.info(f"Playback stopped on {device_name}.")
                except Exception as e:
                    logging.error(f"Error stopping playback on {device_name}: {e}")

            threading.Thread(target=stop_playback).start()

        return {"status": "success", "message": f"Playing '{yt.title}' on {device_name}."}
    except Exception as e:
        logging.error(f"Failed to play YouTube audio on {device_name}: {e}")
        return {"status": "error", "message": str(e)}
