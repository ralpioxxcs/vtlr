import os
import tempfile
import subprocess
import ffmpeg

from google.cloud import texttospeech


def generate_tts(voice: str, text: str, speaker: str, audio_config):
  tts_filename = "tts_output.wav"
  tts_dir = tempfile.gettempdir()
  tts_original_filepath = os.path.join(tts_dir, tts_filename)

  if voice == "google":
    google_tts(text, speaker, tts_original_filepath)
  # elif voice == "hong":
  #   melo_tts(text, tts_original_filepath)
  else:
    print('not supported voice')

  tts_converted_filepath = os.path.join(os.path.dirname(tts_original_filepath),
                                        'tts_output_converted.mp3')

  convert_audio(tts_original_filepath, tts_converted_filepath)

  print(f'path: {tts_converted_filepath}')

  return tts_converted_filepath


def google_tts(text: str, speaker: str, save_to: str):
  client = texttospeech.TextToSpeechClient()
  synthesis_input = texttospeech.SynthesisInput(text=text)
  voice = texttospeech.VoiceSelectionParams(language_code="ko-KR",
                                            name=speaker)
  audio_config = texttospeech.AudioConfig(
      audio_encoding=texttospeech.AudioEncoding.MP3)

  response = client.synthesize_speech(input=synthesis_input,
                                      voice=voice,
                                      audio_config=audio_config)

  with open(save_to, "wb") as out:
    out.write(response.audio_content)


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
      "ffmpeg", "-i", input_file, "-ar", "16000", "-ac", "1", "-y", "-q:a",
      "2", output_file
  ]
  subprocess.run(cmd, check=True)


def deep_smooth_voice(input_file: str, output_file: str, pitch: int, bass: int,
                      treble: int, reverb: int):

  cmd = [
      "sox", input_file, output_file, "pitch",
      str(pitch), "bass",
      str(bass), "treble",
      str(treble), "vol", "1.2", "reverb",
      str(reverb)
  ]
  subprocess.run(cmd, check=True)


def get_audio_duration(file_path):
  probe = ffmpeg.probe(file_path)
  duration = float(probe['format']['duration'])
  return duration


def get_available_speakers():
  client = texttospeech.TextToSpeechClient()
  voices = client.list_voices(language_code='ko-KR')

  speakers = []
  for voice in voices.voices:
    speakers.append({
        'name':
        voice.name,
        'gender':
        texttospeech.SsmlVoiceGender(voice.ssml_gender).name
    })

  return speakers


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
