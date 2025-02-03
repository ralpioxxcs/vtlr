import os
import sys
import tempfile
import subprocess

from pathlib import Path

from gtts import gTTS

submodule_path = Path(__file__).resolve().parent / "../external/melo"
sys.path.append(str(submodule_path))

#from melo.api import TTS


def generate_tts(voice: str, text: str):
  tts_filename = "tts_output.wav"
  tts_dir = tempfile.gettempdir()
  tts_original_filepath = os.path.join(tts_dir, tts_filename)

  if voice == "google":
    google_tts(text, tts_original_filepath)
  # elif voice == "hong":
  #   melo_tts(text, tts_original_filepath)
  else:
    print('not supported voice')

  tts_converted_filepath = os.path.join(os.path.dirname(tts_original_filepath),
                                        'tts_output_converted.wav')
  convert_audio(tts_original_filepath, tts_converted_filepath)

  tts_modified_filepath = os.path.join(os.path.dirname(tts_converted_filepath),
                                       'tts_output_modified.wav')
  deep_smooth_voice(tts_converted_filepath, tts_modified_filepath)

  return tts_modified_filepath


def google_tts(text: str, save_to: str):
  tts = gTTS(text, lang='ko', slow=False)
  tts.save(save_to)


# def melo_tts(text: str, save_to: str):
#   lang = 'KR'
#   device = 'cpu'
#
#   homeDir = Path.home()
#   config_path = os.path.join(homeDir, "config.json")
#   ckpt_path = os.path.join(homeDir, "G.pth")
#
#   # load TTS model
#   model = TTS(language=lang,
#               config_path=config_path,
#               ckpt_path=ckpt_path,
#               device=device)
#
#   for spk_name, spk_id in model.hps.data.spk2id.items():
#     os.makedirs(os.path.dirname(save_to), exist_ok=True)
#     model.tts_to_file(text, spk_id, save_to)
#
#   del model


def convert_audio(input_file: str, output_file: str):
  cmd = [
      "ffmpeg", "-i", input_file, "-ar", "16000", "-ac", "1", "-y", output_file
  ]
  subprocess.run(cmd, check=True)


def deep_smooth_voice(input_file: str, output_file: str):

  cmd = [
      "sox", input_file, output_file, "pitch", "-200", "bass", "+8", "treble",
      "-4", "vol", "1.2", "reverb", "30"
  ]
  subprocess.run(cmd, check=True)
