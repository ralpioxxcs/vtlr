import type { ScheduleList } from "Type";

const baseURL = process.env.NEXT_PUBLIC_SCHEDULE_SERVER;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getScheduleList(): Promise<ScheduleList[]> {
  const url = `${baseURL}/v1.0/scheduler/schedule`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Error fetching schedule list: ${err}`);
    throw err;
  }
}

export async function getSchedulesForToday() {
  try {
    const today = new Date();
    const dateString = formatDate(today);

    const params = new URLSearchParams({ date: dateString });
    const url = `${baseURL}/v1.0/scheduler/schedule?${params}`;

    console.log(`🚀 요청 URL: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `server error: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching schedule list: ${err}`);
    throw err;
  }
}

export async function createSchedule(scheduleData: object) {
  const url = `${baseURL}/v1.0/scheduler/schedule`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`,
      );
    }
    return await response.json();
  } catch (err) {
    console.error(`Error creating schedule: ${err}`);
    throw err;
  }
}

export async function deleteSchedule(id: string) {
  const url = `${baseURL}/v1.0/scheduler/schedule/${id}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error(`Error deleting schedule: ${err}`);
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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Error updating schedule: ${err}`);
    throw err;
  }
}
