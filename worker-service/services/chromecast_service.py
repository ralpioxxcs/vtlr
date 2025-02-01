import boto3
from botocore import endpoint
from botocore.exceptions import NoCredentialsError
from botocore.session import PartialCredentialsError

import pychromecast
from pychromecast.controllers.media import MediaStatusListener
from pychromecast.controllers.receiver import CastStatus, CastStatusListener

import threading

from dotenv import load_dotenv
import os

load_dotenv()

storage_host = os.getenv('STORAGE_HOST')
storage_port = os.getenv('STORAGE_PORT')
storage_bucket_name = os.getenv('STORAGE_BUCKET_NAME')
storage_access_key = os.getenv('STORAGE_ACCESS_KEY')
storage_secret_key = os.getenv('STORAGE_SECRET_KEY')


def generate_presigned_url(bucket_name,
                           object_name,
                           expiration=3600,
                           method="get"):
  s3_client = boto3.client(
      's3',
      endpoint_url=f'http://{storage_host}:{storage_port}',
      aws_access_key_id=storage_access_key,
      aws_secret_access_key=storage_secret_key,
      use_ssl=False)

  try:
    if method.lower() == "get":
      response = s3_client.generate_presigned_url('get_object',
                                                  Params={
                                                      'Bucket': bucket_name,
                                                      'Key': object_name
                                                  },
                                                  ExpiresIn=expiration)
    elif method.lower() == "put":
      response = s3_client.generate_presigned_url('put_object',
                                                  Params={
                                                      'Bucket': bucket_name,
                                                      'Key': object_name
                                                  },
                                                  ExpiresIn=expiration)
    else:
      raise ValueError("Invalid method. Use 'get' or 'put'.")
    return response
  except NoCredentialsError:
    print("AWS credentials not found.")
    return None
  except Exception as e:
    print(f"Error generating presigned URL: {e}")
    return None


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


def process_chromecast_request(data):
  """
    Chromecast 작업 처리 로직
    :param data: 요청 데이터
    :return: 성공 메시지
    """

  playId = data["playId"]

  name = data["device"]["name"]
  ip = data["device"]["ip"]
  volume = data["device"]["volume"]

  result = commandToDevice(name, ip, volume, playId)

  return f"Command is successfully sent (result: ${result})"


def commandToDevice(name: str, ip: str, volume: int, playId: str):
  casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[name],
                                                       known_hosts=[ip])
  if not casts:
    print(f"Chromecast not found")
    return "Not found device"

  cast = casts[0]
  cast.wait()

  bucket_name = 'vtlr-dev-tts-speech'
  object_name = os.path.join('fcf51c3e-4d11-491d-aad5-d9317091fcbe', 'tts.wav')

  url = generate_presigned_url(bucket_name, object_name)

  print('url: ', url)

  cast.set_volume(volume)

  mediaController = cast.media_controller

  listenerCast = MyCastStatusListener(cast.name, cast)
  cast.register_status_listener(listenerCast)

  listener = MyMediaStatusListener(cast.name, cast)
  mediaController.register_status_listener(listener)

  #
  # Play media file
  #
  mediaController.play_media(url,
                             'audio/wav',
                             stream_type=pychromecast.STREAM_TYPE_BUFFERED)
  mediaController.block_until_active()
  mediaController.play()

  print(">>>> Waiting for playback to finish...")
  stop_event.wait()
  stop_event.clear()

  #
  # Finish to play media
  #
  mediaController.stop()
  cast.quit_app()
  #browser.stop_discovery()

  return True
