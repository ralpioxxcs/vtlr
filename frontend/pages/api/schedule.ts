const baseURL = process.env.NEXT_PUBLIC_SCHEDULE_SERVER;

export async function getScheduleList(type?: string) {
  const url = `${baseURL}/schedule`;

  try {
    const response = await fetch(url);
    const json = await response.json();

    let schedules = json;
    if (type) {
      schedules = json.filter((item: any) => {
        return item.type === type;
      });
    }

    return schedules;
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

export async function updateSchedule(id:string, patchData: any) {
  const url = `${baseURL}/schedule/${id}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchData),
    });
    const json = await response.json();
    console.log(json);
    return json;
  } catch (err) {
    console.error(`error is occured (${err})`);
    throw err;
  }
}
