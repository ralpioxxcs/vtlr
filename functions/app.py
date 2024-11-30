import json

from botocore import endpoint
from botocore.exceptions import NoCredentialsError
from botocore.session import PartialCredentialsError
import pychromecast
from pychromecast.controllers.media import MediaStatus, MediaStatusListener
from pychromecast.controllers.receiver import CastStatus, CastStatusListener

from dotenv import load_dotenv
import os

import socket
from gtts import gTTS
import threading

import boto3

load_dotenv()

def upload_file_to_s3(file_name, bucket_name, object_name=None):
    s3_client = boto3.client('s3')
    if object_name is None:
        object_name = file_name

    try:
        s3_client.upload_file(file_name, bucket_name, object_name)
        print(f"'{file_name}' has been uploaded to '{bucket_name}/{object_name}'.")
        return True
    except FileNotFoundError:
        print(f"File '{file_name}' not found.")
        return False
    except NoCredentialsError:
        print("AWS credentials not found.")
        return False
    except PartialCredentialsError:
        print("Incomplete AWS credentials.")
        return False

def generate_presigned_url(bucket_name, object_name, expiration=3600, method="get"):
    s3_client = boto3.client('s3', endpoint_url='http://192.168.7.12:4566')

    try:
        if method.lower() == "get":
            response = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
        elif method.lower() == "put":
            response = s3_client.generate_presigned_url(
                'put_object',
                Params={'Bucket': bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
        else:
            raise ValueError("Invalid method. Use 'get' or 'put'.")
        return response
    except NoCredentialsError:
        print("AWS credentials not found.")
        return None
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        return None

chromecast_ip=os.getenv('CHROMECAST_DEVICE_IP')

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
    volume = data.get('volume', None)

    result = commandToDevice(text, volume, "en")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Lambda function executed successfully",
            "test": result
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

    bucket_name = 'tts-bucket'
    object_name = 'tts.mp3'

    success = upload_file_to_s3(fname, bucket_name, object_name)
    if success:
        print("file upload successful.")
    else:
        print("file upload failed.")

    url = generate_presigned_url(bucket_name, object_name)

    cast.set_volume(volume)

    mediaController = cast.media_controller

    listenerCast = MyCastStatusListener(cast.name, cast)
    cast.register_status_listener(listenerCast)

    listener = MyMediaStatusListener(cast.name, cast)
    mediaController.register_status_listener(listener)

    #
    # Play media file
    #
    mediaController.play_media(url, 'audio/mp3', stream_type=pychromecast.STREAM_TYPE_BUFFERED)
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
