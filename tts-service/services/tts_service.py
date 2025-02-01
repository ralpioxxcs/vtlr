import os
import sys
import tempfile

from pathlib import Path

submodule_path = Path(__file__).resolve().parent / "../external/melo"
sys.path.append(str(submodule_path))

from melo.api import TTS

def makeSpeech(configPath: str, checkPointPath: str, speechText: str):
  lang = 'KR'
  cfgPath = configPath
  ckptPath = checkPointPath
  device = 'cpu'

  # load TTS model
  model = TTS(language=lang,
              config_path=cfgPath,
              ckpt_path=ckptPath,
              device=device)

  ttsFilename = "tts_output.wav"
  ttsFilepath = tempfile.gettempdir()
  ttsSavePath = os.path.join(ttsFilepath, ttsFilename)

  print(f'file save to -> {ttsSavePath}')

  for spk_name, spk_id in model.hps.data.spk2id.items():
    print(f'spk_name: {spk_name}, spk_id: ${spk_id}')

    os.makedirs(os.path.dirname(ttsSavePath), exist_ok=True)

    print(f'create tts...')
    model.tts_to_file(speechText, spk_id, ttsSavePath)

  return ttsSavePath 
