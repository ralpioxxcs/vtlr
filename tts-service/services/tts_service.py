import os
import sys
import tempfile
import subprocess

import ffmpeg

from pathlib import Path

from gtts import gTTS

from services.file_service import download_from_s3

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

  tts_mixed_filepath = os.path.join(os.path.dirname(tts_converted_filepath),
                                    'tts_output_mixed.mp3')

  bgm_temp_path = "/tmp/chillguy.mp3"
  download_from_s3("vtlr-dev-stock-bgm", "chillguy.mp3", bgm_temp_path)
  mix_audio(bgm_temp_path,
            tts_modified_filepath,
            tts_mixed_filepath,
            bg_volume=0.1
            bg_start=9)

  return tts_mixed_filepath


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
      "sox", input_file, output_file, "pitch", "-100", "bass", "+3", "treble",
      "-4", "vol", "1.2", "reverb", "50"
  ]
  subprocess.run(cmd, check=True)


def get_audio_duration(file_path):
  probe = ffmpeg.probe(file_path)
  duration = float(probe['format']['duration'])
  return duration


def mix_audio(background_path,
              voice_path,
              output_path,
              bg_volume=0.5,
              bg_start=10):
  voice_duration = get_audio_duration(voice_path)

  background = (ffmpeg.input(background_path).filter(
      "atrim",
      start=bg_start).filter("asetpts",
                             "PTS-STARTPTS").filter("volume", bg_volume))

  voice = ffmpeg.input(voice_path)

  background = background.filter("atrim", end=voice_duration)

  mixed = ffmpeg.filter([voice, background],
                        "amix",
                        inputs=2,
                        duration="longest")
  output = ffmpeg.output(mixed, output_path, format="mp3")

  ffmpeg.run(output, overwrite_output=True)


#mix_audio()
