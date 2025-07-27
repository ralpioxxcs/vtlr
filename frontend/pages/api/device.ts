import { Device, TTS } from "Type";

const baseURL = process.env.NEXT_PUBLIC_DEVICE_SERVER;

export async function getDevice(): Promise<any> {
  const url = `${baseURL}/v1.0/chromecast/device`;

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

export async function getDeviceConnection(deviceId: string): Promise<Device[]> {
  console.log("deviceId: ", deviceId);
  const url = `${baseURL}/v1.0/chromecast/device/${deviceId}`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function updateDevice(
  deviceId: string,
  name: string,
  ip: string,
  volume: number,
): Promise<any> {
  const url = `${baseURL}/v1.0/chromecast/device/${deviceId}`;
  try {
    const data = {
      device_name: name,
      ip_address: ip,
      volume: volume,
    };
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function playAudio(
  deviceId: string,
  playId: string
): Promise<any> {
  const url = `${baseURL}/v1.0/chromecast/device/play`;

  try {
    const data = {
      deviceIds: [deviceId],
      playId: playId,
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
