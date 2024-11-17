import pychromecast
import socket
from gtts import gTTS

chromecast_ip='0.0.0.0'
fileserver_ip='0.0.0.1'

async def control_device(command: str) -> str:
    casts, browser = pychromecast.get_chromecasts(known_hosts=[chromecast_ip])

    browser.stop_discovery()

    if len(casts) == 0:
        print("No devices found")
        return "Not found device"
    
    cast = casts[0]
    cast.wait()

    print(f'Chromecast device found: {cast}')

    fname = 'tts.mp3'

    tts = gTTS(command, lang='ko')
    tts.save(fname)

    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)

    tts_path = 'http://%s:%s/%s' % (fileserver_ip, 8080, 'tts.mp3')

    print(tts_path)

    cast.set_volume(0.4)

    mc = cast.media_controller
    mc.play_media(tts_path, 'audio/mp3')

    mc.block_until_active()
    mc.pause()
    mc.play()

    return command
