const baseURL = process.env.NEXT_PUBLIC_SCHEDULE_SERVER;

function buildUrl(baseUrl: string, params: object) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
}

export async function getScheduleList(
  type?: string,
  category?: string,
): Promise<any[]> {
  const url = buildUrl(`${baseURL}/v1.0/scheduler/schedule`, {
    scheduleType: type,
    category: category,
  });

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

export async function createSchedule(
  type: string,
  category: string,
  title: string,
  description: string,
  command: string,
  cronExp: string,
) {
  const url = `${baseURL}/v1.0/scheduler/schedule`;

  try {
    const data = {
      title,
      description,
      category,
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
  const url = `${baseURL}/v1.0/scheduler/schedule/${id}`;

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

export async function updateSchedule(id: string, patchData: any) {
  const url = `${baseURL}/v1.0/scheduler/schedule/${id}`;

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
