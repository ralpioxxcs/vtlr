import pychromecast
import socket
from gtts import gTTS
from time import sleep

chromecast_ip='0.0.0.0'
fileserver_ip='0.0.0.1'

async def voiceToDevice(text: str, vol: float):
    casts, browser = pychromecast.get_chromecasts(known_hosts=[chromecast_ip])

    if len(casts) == 0:
        print("No devices found")
        return "Not found device"
    
    cast = casts[0]
    cast.wait()

    fname = 'tts.mp3'

    tts = gTTS(text, lang='ko')
    tts.save(fname)

    print(">>>> Success to save file")

    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)

    tts_path = 'http://%s:%s/%s' % (fileserver_ip, 8080, 'tts.mp3')

    print(f">>>> {tts_path}")

    cast.set_volume(vol)

    mediaController = cast.media_controller
    mediaController.play_media(tts_path, 'audio/mp3')
    #mediaController.block_until_active()

    print(f">>>> media controller status: {mediaController.status.player_state}");

    mediaController.stop();

    sleep(3)
    print(mediaController.status.player_state);

    cast.quit_app();

    browser.stop_discovery()

    return True 
