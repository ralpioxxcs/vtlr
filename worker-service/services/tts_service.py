import os
import tempfile
import sys

from pathlib import Path

from util.file import uploadFileToS3

submodule_path = Path(__file__).resolve().parent / "../external/MeloTTS"
sys.path.append(str(submodule_path))

from melo.api import TTS

import os
from pathlib import Path

def load_model():
  homeDir = Path.home()
  configPath = os.path.join(homeDir, "config.json")
  ckptPath = os.path.join(homeDir, "G.pth")

  model = TTS(language='KR', config_path=configPath, ckpt_path=ckptPath, device='cpu')
  return model

def generate_tts(text: str, playId: str) -> str:
  print('generate tts', playId)
  model = load_model()
  print(f'generate tts .. (text: {text})')

  filename = 'tts_output.wav'
  filepath = tempfile.gettempdir()
  savepath = os.path.join(filepath, filename)

  for spk_name, spk_id in model.hps.data.spk2id.items():
    print(f'spk_name: {spk_name} / spk_id: {spk_id}')
    os.makedirs(os.path.dirname(savepath), exist_ok=True)
    model.tts_to_file(text, spk_id, savepath)

    # Upload WAV file to Storage bucket
    bucketName = 'vtlr-dev-tts-speech'
    objectName = os.path.join(playId, 'tts.wav')

    success = uploadFileToS3(savepath, bucketName, objectName)
    if success:
        print("file upload successful.")
    else:
        print("file upload failed.")

  return "wow"
