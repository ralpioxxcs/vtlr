import type { ScheduleList } from "Type";

const baseURL = process.env.NEXT_PUBLIC_SCHEDULE_SERVER;

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
  const schedules = await getScheduleList();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return schedules.filter(schedule => {
    if (schedule.schedule_config?.type === 'ONE_TIME') {
      return schedule.schedule_config.datetime.startsWith(todayStr);
    }
    return false;
  });
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
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
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
