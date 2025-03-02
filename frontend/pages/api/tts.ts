import { Device, TTS } from "Type";

const baseURL = process.env.NEXT_PUBLIC_TTS_SERVER;

export async function getTTS(): Promise<any> {
  const url = `${baseURL}/v1.0/tts`;

  try {
    const response = await fetch(url);
    console.log(response);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function getTTSConfiguration(ttsId: string): Promise<TTS[]> {
  console.log("ttsId: ", ttsId);
  const url = `${baseURL}/v1.0/tts/${ttsId}`;

  try {
    const response = await fetch(url);
    console.log("getTTSresponse: ", response);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function setTTSConfiguration(
  ttsId: string,
  pitch: number,
  bass: number,
  treble: number,
  reverb: number,
): Promise<TTS[]> {
  const url = `${baseURL}/v1.0/tts/${ttsId}`;

  try {
    const data = {
      pitch,
      bass,
      treble,
      reverb,
    };
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log(response);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function makeSpeech(ttsId: string, text: string): Promise<any> {
  const url = `${baseURL}/v1.0/tts/${ttsId}/speech`;

  try {
    const data = {
      text: text,
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log(response);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}
