const baseURL = "http://127.0.0.1:4000";

export async function getScheduleList() {
  const url = `${baseURL}/schedule`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function createSchedule(
  type: string,
  title: string,
  description: string,
  command: string,
  cronExp: string,
) {
  const url = `${baseURL}/schedule`;

  try {
    const data = {
      title,
      description,
      type,
      interval: cronExp,
      active: true,
      param: {
        text: command,
        volume: 50,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    console.log(json);
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}

export async function deleteSchedule(id: string) {
  const url = `${baseURL}/schedule/${id}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    const json = await response.json();
    console.log(json);
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}
