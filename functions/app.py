import json

import pychromecast
from pychromecast.controllers.media import MediaStatus, MediaStatusListener
from pychromecast.controllers.receiver import CastStatus, CastStatusListener

import socket
from gtts import gTTS
import threading

chromecast_ip='192.168.x.x'
fileserver_ip='192.168.x.x'

stop_event = threading.Event()

class MyCastStatusListener(CastStatusListener):
    """Cast status listener"""

    def __init__(self, name: str | None, cast: pychromecast.Chromecast) -> None:
        self.name = name
        self.cast = cast

    def new_cast_status(self, status: CastStatus) -> None:
        return

class MyMediaStatusListener(MediaStatusListener):
    def __init__(self, name: str | None, cast: pychromecast.Chromecast) -> None:
        self.name = name
        self.cast = cast

    def new_media_status(self, status):
        print(f">>>> Media status updated: {status.player_state}")

        if status.player_state == "IDLE" and status.idle_reason == "FINISHED":
            print(f">>>> Playback is finished !!!!!")
            stop_event.set()

    def load_media_failed(self, item: int, error_code: int) -> None:
        print("load media failed!")

def lambda_handler(event, context):
    data = event.get('data', None)
    text = data.get('text', None)

    print(f"data: {data}")

    commandToDevice(data.text, 0.7, "en")
    
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Lambda function executed successfully",
        })
    }

def commandToDevice(text: str, volume: float, lang: str):
    casts, browser = pychromecast.get_listed_chromecasts(friendly_names=["hong"], known_hosts=[chromecast_ip])
    if not casts:
        print(f"Chromecast not found")
        return "Not found device"

    cast = casts[0]
    cast.wait()

    fname = '/tmp/tts.mp3'
    tts = gTTS(text, lang=lang, slow=True)
    tts.save(fname)

    print(">>>> Success to save file")

    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)

    tts_path = 'http://%s:%s/%s' % (fileserver_ip, 8080, 'tts.mp3')

    print(f">>>> {tts_path}")

    cast.set_volume(volume)

    mediaController = cast.media_controller

    listenerCast = MyCastStatusListener(cast.name, cast)
    cast.register_status_listener(listenerCast)

    listener = MyMediaStatusListener(cast.name, cast)
    mediaController.register_status_listener(listener)

    #
    # Play media file
    #
    mediaController.play_media(tts_path, 'audio/mp3', stream_type=pychromecast.STREAM_TYPE_BUFFERED)
    mediaController.block_until_active()
    mediaController.play();

    print(">>>> Waiting for playback to finish...")
    stop_event.wait()
    stop_event.clear()

    #
    # Finish to play media
    #
    mediaController.stop();
    cast.quit_app();
    #browser.stop_discovery()

    return True
