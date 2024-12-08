import Schedule from "@/components/schedule";

export const metadata = {
  title: "홈",
};

export const API_URL = "http://127.0.0.1:4000/schedule";

async function getSchedules() {
  const response = await fetch(API_URL);
  const json = await response.json();
  return json;
}

export default async function Home() {
  const schedules = await getSchedules();
  return (
    <div className="">
      {schedules.map((schedule: any) => (
        <Schedule
          key={schedule.rowId}
          title={schedule.title}
          description={schedule.title}
          type={schedule.type}
          interval={schedule.interval}
          active={schedule.active}
          createdAt={schedule.createdAt}
        />
      ))}
    </div>
  );
}
